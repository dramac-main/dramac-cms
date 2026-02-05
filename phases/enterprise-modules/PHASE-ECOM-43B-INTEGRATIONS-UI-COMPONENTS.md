# PHASE-ECOM-43B: Integrations & Webhooks - UI Components

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 5-6 hours
> **Prerequisites**: PHASE-ECOM-43A Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create the dashboard UI components for managing API keys, webhook endpoints, external integrations, and sync jobs. This phase delivers the developer tools and integration management interface for the e-commerce platform.

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] PHASE-ECOM-43A complete (integration-actions.ts exists)
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

```
Integrations UI Architecture (Phase 43B)
├── API Keys
│   ├── ApiKeysView              → List/manage API keys
│   ├── CreateApiKeyDialog       → Create new key with scopes
│   ├── ApiKeyCard               → Key display with copy/revoke
│   └── ScopeSelector            → Permission selection
│
├── Webhooks
│   ├── WebhooksView             → List/manage endpoints
│   ├── WebhookEndpointDialog    → Create/edit endpoint
│   ├── WebhookEventPicker       → Event subscription selection
│   ├── WebhookDeliveryLog       → Delivery history table
│   └── WebhookTestButton        → Test endpoint button
│
├── Integrations
│   ├── IntegrationsView         → Integration catalog
│   ├── IntegrationCard          → Provider card with status
│   ├── ConnectIntegrationDialog → OAuth/API key connection
│   └── IntegrationLogsDrawer    → Activity log
│
└── Hooks
    ├── useApiKeys()             → API key management
    ├── useWebhooks()            → Webhook management
    └── useIntegrations()        → Integration management
```

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `hooks/ecommerce/use-integrations.ts` | Create | Integration hooks |
| `components/ecommerce/views/api-keys-view.tsx` | Create | API key management |
| `components/ecommerce/dialogs/create-api-key-dialog.tsx` | Create | Create API key |
| `components/ecommerce/views/webhooks-view.tsx` | Create | Webhook management |
| `components/ecommerce/dialogs/webhook-endpoint-dialog.tsx` | Create | Create/edit webhook |
| `components/ecommerce/views/integrations-view.tsx` | Create | Integration catalog |
| `components/ecommerce/views/developer-settings-view.tsx` | Create | Main settings view |

---

## 📋 Implementation Tasks

### Task 43B.1: Create Integration Hooks

**File**: `src/hooks/ecommerce/use-integrations.ts`
**Action**: Create

```typescript
/**
 * Integration Hooks
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * Hooks for managing API keys, webhooks, and integrations.
 */
'use client'

import { useState, useCallback, useEffect, useTransition } from 'react'
import {
  // API Keys
  getApiKeys,
  createApiKey,
  updateApiKey,
  revokeApiKey,
  rotateApiKey,
  // Webhooks
  getWebhookEndpoints,
  getWebhookEventTypes,
  createWebhookEndpoint,
  updateWebhookEndpoint,
  deleteWebhookEndpoint,
  rotateWebhookSecret,
  getWebhookDeliveries,
  testWebhookEndpoint,
  // Integrations
  getIntegrations,
  connectIntegration,
  updateIntegration,
  disconnectIntegration,
  getIntegrationLogs
} from '@/modules/ecommerce/actions/integration-actions'
import type {
  ApiKey,
  ApiKeyWithSecret,
  CreateApiKeyInput,
  UpdateApiKeyInput,
  WebhookEndpoint,
  WebhookEventTypeInfo,
  CreateWebhookInput,
  UpdateWebhookInput,
  WebhookDelivery,
  Integration,
  ConnectIntegrationInput,
  UpdateIntegrationInput,
  IntegrationLog
} from '@/modules/ecommerce/types/integration-types'

// ============================================================================
// useApiKeys
// ============================================================================

interface UseApiKeysReturn {
  keys: ApiKey[]
  isLoading: boolean
  isPending: boolean
  error: string | null
  
  refresh: () => Promise<void>
  create: (input: CreateApiKeyInput) => Promise<ApiKeyWithSecret | null>
  update: (id: string, input: UpdateApiKeyInput) => Promise<boolean>
  revoke: (id: string) => Promise<boolean>
  rotate: (id: string) => Promise<ApiKeyWithSecret | null>
}

export function useApiKeys(siteId: string): UseApiKeysReturn {
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keys, setKeys] = useState<ApiKey[]>([])
  
  const refresh = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await getApiKeys(siteId)
      setKeys(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])
  
  const create = useCallback(async (input: CreateApiKeyInput): Promise<ApiKeyWithSecret | null> => {
    const result = await createApiKey(siteId, input)
    if (result.success && result.key) {
      setKeys(prev => [{ ...result.key!, secret_key: undefined } as unknown as ApiKey, ...prev])
      return result.key
    }
    setError(result.error ?? 'Failed to create API key')
    return null
  }, [siteId])
  
  const update = useCallback(async (id: string, input: UpdateApiKeyInput): Promise<boolean> => {
    const result = await updateApiKey(id, input)
    if (result.success) {
      setKeys(prev => prev.map(k => k.id === id ? { ...k, ...input } : k))
      return true
    }
    setError(result.error ?? 'Failed to update API key')
    return false
  }, [])
  
  const revoke = useCallback(async (id: string): Promise<boolean> => {
    const result = await revokeApiKey(id)
    if (result.success) {
      setKeys(prev => prev.filter(k => k.id !== id))
      return true
    }
    setError(result.error ?? 'Failed to revoke API key')
    return false
  }, [])
  
  const rotate = useCallback(async (id: string): Promise<ApiKeyWithSecret | null> => {
    const result = await rotateApiKey(id)
    if (result.success && result.key) {
      setKeys(prev => prev.map(k => 
        k.id === id ? { ...k, key_prefix: result.key!.key_prefix } : k
      ))
      return result.key
    }
    setError(result.error ?? 'Failed to rotate API key')
    return null
  }, [])
  
  useEffect(() => {
    refresh()
  }, [refresh])
  
  return {
    keys,
    isLoading,
    isPending,
    error,
    refresh,
    create,
    update,
    revoke,
    rotate
  }
}

// ============================================================================
// useWebhooks
// ============================================================================

interface UseWebhooksReturn {
  endpoints: WebhookEndpoint[]
  eventTypes: WebhookEventTypeInfo[]
  isLoading: boolean
  isPending: boolean
  error: string | null
  
  refresh: () => Promise<void>
  create: (input: CreateWebhookInput) => Promise<WebhookEndpoint | null>
  update: (id: string, input: UpdateWebhookInput) => Promise<boolean>
  remove: (id: string) => Promise<boolean>
  rotateSecret: (id: string) => Promise<string | null>
  test: (id: string) => Promise<{ success: boolean; error?: string }>
  getDeliveries: (endpointId: string) => Promise<WebhookDelivery[]>
}

export function useWebhooks(siteId: string): UseWebhooksReturn {
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([])
  const [eventTypes, setEventTypes] = useState<WebhookEventTypeInfo[]>([])
  
  const refresh = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const [endpointsData, typesData] = await Promise.all([
        getWebhookEndpoints(siteId),
        getWebhookEventTypes()
      ])
      setEndpoints(endpointsData)
      setEventTypes(typesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch webhooks')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])
  
  const create = useCallback(async (input: CreateWebhookInput): Promise<WebhookEndpoint | null> => {
    const result = await createWebhookEndpoint(siteId, input)
    if (result.success && result.endpoint) {
      setEndpoints(prev => [result.endpoint!, ...prev])
      return result.endpoint
    }
    setError(result.error ?? 'Failed to create webhook')
    return null
  }, [siteId])
  
  const update = useCallback(async (id: string, input: UpdateWebhookInput): Promise<boolean> => {
    const result = await updateWebhookEndpoint(id, input)
    if (result.success) {
      setEndpoints(prev => prev.map(e => e.id === id ? { ...e, ...input } : e))
      return true
    }
    setError(result.error ?? 'Failed to update webhook')
    return false
  }, [])
  
  const remove = useCallback(async (id: string): Promise<boolean> => {
    const result = await deleteWebhookEndpoint(id)
    if (result.success) {
      setEndpoints(prev => prev.filter(e => e.id !== id))
      return true
    }
    setError(result.error ?? 'Failed to delete webhook')
    return false
  }, [])
  
  const rotateSecret = useCallback(async (id: string): Promise<string | null> => {
    const result = await rotateWebhookSecret(id)
    if (result.success && result.secret) {
      await refresh()
      return result.secret
    }
    setError(result.error ?? 'Failed to rotate secret')
    return null
  }, [refresh])
  
  const test = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const result = await testWebhookEndpoint(id)
    return { success: result.success, error: result.error }
  }, [])
  
  const getDeliveries = useCallback(async (endpointId: string): Promise<WebhookDelivery[]> => {
    return await getWebhookDeliveries(endpointId)
  }, [])
  
  useEffect(() => {
    refresh()
  }, [refresh])
  
  return {
    endpoints,
    eventTypes,
    isLoading,
    isPending,
    error,
    refresh,
    create,
    update,
    remove,
    rotateSecret,
    test,
    getDeliveries
  }
}

// ============================================================================
// useIntegrations
// ============================================================================

interface UseIntegrationsReturn {
  integrations: Integration[]
  isLoading: boolean
  isPending: boolean
  error: string | null
  
  refresh: () => Promise<void>
  connect: (input: ConnectIntegrationInput) => Promise<Integration | null>
  update: (id: string, input: UpdateIntegrationInput) => Promise<boolean>
  disconnect: (id: string) => Promise<boolean>
  getLogs: (id: string) => Promise<IntegrationLog[]>
}

export function useIntegrations(siteId: string): UseIntegrationsReturn {
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  
  const refresh = useCallback(async () => {
    if (!siteId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await getIntegrations(siteId)
      setIntegrations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])
  
  const connect = useCallback(async (input: ConnectIntegrationInput): Promise<Integration | null> => {
    const result = await connectIntegration(siteId, input)
    if (result.success && result.integration) {
      setIntegrations(prev => [result.integration!, ...prev])
      return result.integration
    }
    setError(result.error ?? 'Failed to connect integration')
    return null
  }, [siteId])
  
  const update = useCallback(async (id: string, input: UpdateIntegrationInput): Promise<boolean> => {
    const result = await updateIntegration(id, input)
    if (result.success) {
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, ...input } : i))
      return true
    }
    setError(result.error ?? 'Failed to update integration')
    return false
  }, [])
  
  const disconnect = useCallback(async (id: string): Promise<boolean> => {
    const result = await disconnectIntegration(id)
    if (result.success) {
      setIntegrations(prev => prev.filter(i => i.id !== id))
      return true
    }
    setError(result.error ?? 'Failed to disconnect integration')
    return false
  }, [])
  
  const getLogs = useCallback(async (id: string): Promise<IntegrationLog[]> => {
    return await getIntegrationLogs(id)
  }, [])
  
  useEffect(() => {
    refresh()
  }, [refresh])
  
  return {
    integrations,
    isLoading,
    isPending,
    error,
    refresh,
    connect,
    update,
    disconnect,
    getLogs
  }
}
```

---

### Task 43B.2: Create API Keys View

**File**: `src/components/ecommerce/views/api-keys-view.tsx`
**Action**: Create

```typescript
/**
 * API Keys View
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * List and manage API keys with create/revoke functionality.
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  MoreVertical, 
  Key, 
  RefreshCw, 
  Trash2,
  Copy,
  Check,
  Clock,
  Shield
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { useApiKeys } from '@/hooks/ecommerce/use-integrations'
import { CreateApiKeyDialog } from '../dialogs/create-api-key-dialog'
import type { ApiKey, ApiKeyWithSecret } from '@/modules/ecommerce/types/integration-types'

// ============================================================================
// TYPES
// ============================================================================

interface ApiKeysViewProps {
  siteId: string
}

// ============================================================================
// KEY DISPLAY DIALOG
// ============================================================================

interface KeyDisplayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiKey: ApiKeyWithSecret | null
}

function KeyDisplayDialog({ open, onOpenChange, apiKey }: KeyDisplayDialogProps) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    if (apiKey?.secret_key) {
      navigator.clipboard.writeText(apiKey.secret_key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            API Key Created
          </AlertDialogTitle>
          <AlertDialogDescription>
            Copy your API key now. You won't be able to see it again!
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-4">
          <div className="bg-muted rounded-lg p-4 font-mono text-sm break-all">
            {apiKey?.secret_key}
          </div>
        </div>
        
        <AlertDialogFooter>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Key
              </>
            )}
          </Button>
          <AlertDialogAction>I've Saved the Key</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ApiKeysView({ siteId }: ApiKeysViewProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [keyDisplayOpen, setKeyDisplayOpen] = useState(false)
  const [newKey, setNewKey] = useState<ApiKeyWithSecret | null>(null)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null)
  
  const {
    keys,
    isLoading,
    error,
    create,
    revoke,
    rotate
  } = useApiKeys(siteId)
  
  const handleCreate = async (input: Parameters<typeof create>[0]) => {
    const key = await create(input)
    if (key) {
      setNewKey(key)
      setKeyDisplayOpen(true)
      setCreateDialogOpen(false)
    }
    return key
  }
  
  const handleRevoke = async () => {
    if (keyToRevoke) {
      await revoke(keyToRevoke.id)
      setRevokeDialogOpen(false)
      setKeyToRevoke(null)
    }
  }
  
  const handleRotate = async (key: ApiKey) => {
    const rotatedKey = await rotate(key.id)
    if (rotatedKey) {
      setNewKey(rotatedKey)
      setKeyDisplayOpen(true)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">
            Manage API keys for programmatic access to your store
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>
      
      {/* Warning */}
      <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
        <CardContent className="pt-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Keep your API keys secure
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Do not share your API keys in public repositories or client-side code.
              Rotate keys if you suspect they've been compromised.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {/* Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Keys</CardTitle>
          <CardDescription>
            Keys used to authenticate API requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No API keys</h3>
              <p className="text-muted-foreground mb-4">
                Create your first API key to start integrating
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{key.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {key.key_prefix}{'•'.repeat(20)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.slice(0, 3).map((scope) => (
                          <Badge key={scope} variant="secondary" className="text-xs">
                            {scope.split(':')[1]}
                          </Badge>
                        ))}
                        {key.scopes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{key.scopes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {key.last_used_at ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })}
                        </div>
                      ) : (
                        'Never'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(key.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRotate(key)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Rotate Key
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setKeyToRevoke(key)
                              setRevokeDialogOpen(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Create Dialog */}
      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreate}
      />
      
      {/* Key Display Dialog */}
      <KeyDisplayDialog
        open={keyDisplayOpen}
        onOpenChange={setKeyDisplayOpen}
        apiKey={newKey}
      />
      
      {/* Revoke Confirmation */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke "{keyToRevoke?.name}"? 
              Any applications using this key will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive">
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ApiKeysView
```

---

### Task 43B.3: Create API Key Dialog

**File**: `src/components/ecommerce/dialogs/create-api-key-dialog.tsx`
**Action**: Create

```typescript
/**
 * Create API Key Dialog
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * Dialog for creating new API keys with scope selection.
 */
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Key, Info } from 'lucide-react'
import { ALL_SCOPES, SCOPE_DESCRIPTIONS } from '@/lib/ecommerce/api-key-utils'
import type { 
  ApiKeyScope, 
  CreateApiKeyInput,
  ApiKeyWithSecret 
} from '@/modules/ecommerce/types/integration-types'

// ============================================================================
// TYPES
// ============================================================================

interface CreateApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: CreateApiKeyInput) => Promise<ApiKeyWithSecret | null>
}

// ============================================================================
// SCOPE GROUPS
// ============================================================================

const SCOPE_GROUPS: { name: string; scopes: ApiKeyScope[] }[] = [
  {
    name: 'Products',
    scopes: ['read:products', 'write:products']
  },
  {
    name: 'Orders',
    scopes: ['read:orders', 'write:orders']
  },
  {
    name: 'Customers',
    scopes: ['read:customers', 'write:customers']
  },
  {
    name: 'Inventory',
    scopes: ['read:inventory', 'write:inventory']
  },
  {
    name: 'Analytics',
    scopes: ['read:analytics']
  },
  {
    name: 'Webhooks',
    scopes: ['webhooks:manage']
  }
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onCreate
}: CreateApiKeyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<ApiKeyScope[]>([])
  
  const handleScopeToggle = (scope: ApiKeyScope) => {
    setSelectedScopes(prev => 
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    )
  }
  
  const handleGroupToggle = (scopes: ApiKeyScope[]) => {
    const allSelected = scopes.every(s => selectedScopes.includes(s))
    if (allSelected) {
      setSelectedScopes(prev => prev.filter(s => !scopes.includes(s)))
    } else {
      setSelectedScopes(prev => [...new Set([...prev, ...scopes])])
    }
  }
  
  const selectAll = () => {
    setSelectedScopes([...ALL_SCOPES])
  }
  
  const selectNone = () => {
    setSelectedScopes([])
  }
  
  const handleSubmit = async () => {
    if (!name.trim() || selectedScopes.length === 0) return
    
    setIsSubmitting(true)
    
    await onCreate({
      name: name.trim(),
      scopes: selectedScopes
    })
    
    setIsSubmitting(false)
    setName('')
    setSelectedScopes([])
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Create API Key
          </DialogTitle>
          <DialogDescription>
            Create a new API key with specific permissions
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="key-name">Key Name *</Label>
            <Input
              id="key-name"
              placeholder="My Integration"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A descriptive name to identify this key
            </p>
          </div>
          
          {/* Scopes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Permissions *</Label>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={selectAll}
                >
                  Select All
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={selectNone}
                >
                  Clear
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              {SCOPE_GROUPS.map((group) => {
                const allSelected = group.scopes.every(s => selectedScopes.includes(s))
                const someSelected = group.scopes.some(s => selectedScopes.includes(s))
                
                return (
                  <div key={group.name} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`group-${group.name}`}
                        checked={allSelected}
                        onCheckedChange={() => handleGroupToggle(group.scopes)}
                        className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                      />
                      <Label 
                        htmlFor={`group-${group.name}`}
                        className="font-medium cursor-pointer"
                      >
                        {group.name}
                      </Label>
                    </div>
                    
                    <div className="ml-6 space-y-2">
                      {group.scopes.map((scope) => (
                        <div key={scope} className="flex items-start gap-2">
                          <Checkbox
                            id={scope}
                            checked={selectedScopes.includes(scope)}
                            onCheckedChange={() => handleScopeToggle(scope)}
                          />
                          <div className="grid gap-0.5">
                            <Label 
                              htmlFor={scope}
                              className="text-sm cursor-pointer"
                            >
                              {scope}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {SCOPE_DESCRIPTIONS[scope]}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              The API key will only be shown once after creation. 
              Make sure to copy and store it securely.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim() || selectedScopes.length === 0}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 43B.4: Create Webhooks View

**File**: `src/components/ecommerce/views/webhooks-view.tsx`
**Action**: Create

```typescript
/**
 * Webhooks View
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * List and manage webhook endpoints with test functionality.
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  MoreVertical, 
  Webhook, 
  Pencil,
  Trash2,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { useWebhooks } from '@/hooks/ecommerce/use-integrations'
import { WebhookEndpointDialog } from '../dialogs/webhook-endpoint-dialog'
import type { WebhookEndpoint } from '@/modules/ecommerce/types/integration-types'

// ============================================================================
// TYPES
// ============================================================================

interface WebhooksViewProps {
  siteId: string
}

// ============================================================================
// STATUS INDICATOR
// ============================================================================

function StatusIndicator({ endpoint }: { endpoint: WebhookEndpoint }) {
  if (!endpoint.active) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
        <span className="text-sm">Disabled</span>
      </div>
    )
  }
  
  if (endpoint.consecutive_failures >= 5) {
    return (
      <div className="flex items-center gap-1.5 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm">Failing</span>
      </div>
    )
  }
  
  if (endpoint.last_success_at) {
    return (
      <div className="flex items-center gap-1.5 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Healthy</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-1.5 text-amber-600">
      <div className="h-2 w-2 rounded-full bg-amber-600" />
      <span className="text-sm">Pending</span>
    </div>
  )
}

// ============================================================================
// WEBHOOK CARD
// ============================================================================

interface WebhookCardProps {
  endpoint: WebhookEndpoint
  onEdit: () => void
  onDelete: () => void
  onToggle: (active: boolean) => void
  onTest: () => void
  isTestng: boolean
}

function WebhookCard({ 
  endpoint, 
  onEdit, 
  onDelete, 
  onToggle, 
  onTest,
  isTestng 
}: WebhookCardProps) {
  return (
    <Card className={endpoint.consecutive_failures >= 5 ? 'border-destructive' : ''}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Webhook className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{endpoint.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <a 
                    href={endpoint.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1 max-w-[250px] truncate"
                  >
                    {endpoint.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={endpoint.active}
                onCheckedChange={onToggle}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onTest} disabled={isTestng}>
                    {isTestng ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Send Test
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Status & Events */}
          <div className="flex items-center justify-between">
            <StatusIndicator endpoint={endpoint} />
            <div className="flex flex-wrap gap-1 max-w-[60%] justify-end">
              {endpoint.events.slice(0, 3).map((event) => (
                <Badge key={event} variant="outline" className="text-xs">
                  {event}
                </Badge>
              ))}
              {endpoint.events.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{endpoint.events.length - 3}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Last Activity */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            {endpoint.last_success_at && (
              <div>
                Last success: {formatDistanceToNow(new Date(endpoint.last_success_at), { addSuffix: true })}
              </div>
            )}
            {endpoint.consecutive_failures > 0 && (
              <div className="text-destructive">
                {endpoint.consecutive_failures} consecutive failures
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WebhooksView({ siteId }: WebhooksViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState<WebhookEndpoint | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [endpointToDelete, setEndpointToDelete] = useState<WebhookEndpoint | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  
  const {
    endpoints,
    eventTypes,
    isLoading,
    error,
    create,
    update,
    remove,
    test
  } = useWebhooks(siteId)
  
  const handleEdit = (endpoint: WebhookEndpoint) => {
    setEditingEndpoint(endpoint)
    setDialogOpen(true)
  }
  
  const handleDelete = (endpoint: WebhookEndpoint) => {
    setEndpointToDelete(endpoint)
    setDeleteDialogOpen(true)
  }
  
  const confirmDelete = async () => {
    if (endpointToDelete) {
      await remove(endpointToDelete.id)
      setDeleteDialogOpen(false)
      setEndpointToDelete(null)
    }
  }
  
  const handleToggle = async (endpoint: WebhookEndpoint, active: boolean) => {
    await update(endpoint.id, { active })
  }
  
  const handleTest = async (endpoint: WebhookEndpoint) => {
    setTestingId(endpoint.id)
    const result = await test(endpoint.id)
    setTestingId(null)
    // Could show toast here
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Webhooks</h2>
          <p className="text-muted-foreground">
            Receive real-time notifications when events occur
          </p>
        </div>
        <Button onClick={() => { setEditingEndpoint(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Endpoint
        </Button>
      </div>
      
      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {/* Endpoints */}
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : endpoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No webhook endpoints</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-sm">
              Add an endpoint to receive notifications when events occur in your store
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Endpoint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {endpoints.map((endpoint) => (
            <WebhookCard
              key={endpoint.id}
              endpoint={endpoint}
              onEdit={() => handleEdit(endpoint)}
              onDelete={() => handleDelete(endpoint)}
              onToggle={(active) => handleToggle(endpoint, active)}
              onTest={() => handleTest(endpoint)}
              isTestng={testingId === endpoint.id}
            />
          ))}
        </div>
      )}
      
      {/* Create/Edit Dialog */}
      <WebhookEndpointDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        endpoint={editingEndpoint}
        eventTypes={eventTypes}
        onCreate={create}
        onUpdate={update}
      />
      
      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook Endpoint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{endpointToDelete?.name}"? 
              This will stop all deliveries to this endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default WebhooksView
```

---

### Task 43B.5: Create Developer Settings View

**File**: `src/components/ecommerce/views/developer-settings-view.tsx`
**Action**: Create

```typescript
/**
 * Developer Settings View
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * Main developer settings page with API keys, webhooks, and integrations.
 */
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Key, Webhook, Plug, Code2 } from 'lucide-react'
import { ApiKeysView } from './api-keys-view'
import { WebhooksView } from './webhooks-view'
// import { IntegrationsView } from './integrations-view'

// ============================================================================
// TYPES
// ============================================================================

interface DeveloperSettingsViewProps {
  siteId: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DeveloperSettingsView({ siteId }: DeveloperSettingsViewProps) {
  const [activeTab, setActiveTab] = useState('api-keys')
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Code2 className="h-8 w-8" />
          Developer Settings
        </h1>
        <p className="text-muted-foreground">
          API keys, webhooks, and integrations for extending your store
        </p>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            <span className="hidden sm:inline">Webhooks</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysView siteId={siteId} />
        </TabsContent>
        
        <TabsContent value="webhooks" className="mt-6">
          <WebhooksView siteId={siteId} />
        </TabsContent>
        
        <TabsContent value="integrations" className="mt-6">
          {/* Integrations view placeholder */}
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
            <Plug className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Third-Party Integrations</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Connect payment providers, shipping carriers, and other services
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DeveloperSettingsView
```

---

### Task 43B.6: Create Webhook Endpoint Dialog

**File**: `src/components/ecommerce/dialogs/webhook-endpoint-dialog.tsx`
**Action**: Create

```typescript
/**
 * Webhook Endpoint Dialog
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * Dialog for creating and editing webhook endpoints.
 */
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Loader2, Webhook } from 'lucide-react'
import type { 
  WebhookEndpoint, 
  WebhookEventTypeInfo,
  WebhookEventType,
  CreateWebhookInput,
  UpdateWebhookInput
} from '@/modules/ecommerce/types/integration-types'

// ============================================================================
// TYPES
// ============================================================================

interface WebhookEndpointDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  endpoint: WebhookEndpoint | null
  eventTypes: WebhookEventTypeInfo[]
  onCreate: (input: CreateWebhookInput) => Promise<WebhookEndpoint | null>
  onUpdate: (id: string, input: UpdateWebhookInput) => Promise<boolean>
}

// ============================================================================
// GROUP EVENTS BY CATEGORY
// ============================================================================

function groupEventsByCategory(eventTypes: WebhookEventTypeInfo[]): Record<string, WebhookEventTypeInfo[]> {
  const groups: Record<string, WebhookEventTypeInfo[]> = {}
  
  for (const event of eventTypes) {
    if (!groups[event.category]) {
      groups[event.category] = []
    }
    groups[event.category].push(event)
  }
  
  return groups
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WebhookEndpointDialog({
  open,
  onOpenChange,
  endpoint,
  eventTypes,
  onCreate,
  onUpdate
}: WebhookEndpointDialogProps) {
  const isEditing = !!endpoint
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<WebhookEventType[]>([])
  
  // Group events
  const eventGroups = groupEventsByCategory(eventTypes)
  
  // Populate form when editing
  useEffect(() => {
    if (endpoint) {
      setName(endpoint.name)
      setUrl(endpoint.url)
      setDescription(endpoint.description ?? '')
      setSelectedEvents(endpoint.events)
    } else {
      setName('')
      setUrl('')
      setDescription('')
      setSelectedEvents([])
    }
  }, [endpoint, open])
  
  const handleEventToggle = (eventType: WebhookEventType) => {
    setSelectedEvents(prev => 
      prev.includes(eventType)
        ? prev.filter(e => e !== eventType)
        : [...prev, eventType]
    )
  }
  
  const handleCategoryToggle = (events: WebhookEventTypeInfo[]) => {
    const eventTypes = events.map(e => e.event_type as WebhookEventType)
    const allSelected = eventTypes.every(e => selectedEvents.includes(e))
    
    if (allSelected) {
      setSelectedEvents(prev => prev.filter(e => !eventTypes.includes(e)))
    } else {
      setSelectedEvents(prev => [...new Set([...prev, ...eventTypes])])
    }
  }
  
  const selectAllEvents = () => {
    setSelectedEvents(eventTypes.map(e => e.event_type as WebhookEventType))
  }
  
  const handleSubmit = async () => {
    if (!name.trim() || !url.trim() || selectedEvents.length === 0) return
    
    setIsSubmitting(true)
    
    if (isEditing && endpoint) {
      await onUpdate(endpoint.id, {
        name: name.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        events: selectedEvents
      })
    } else {
      await onCreate({
        name: name.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        events: selectedEvents
      })
    }
    
    setIsSubmitting(false)
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            {isEditing ? 'Edit Webhook' : 'Add Webhook Endpoint'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the webhook endpoint settings'
              : 'Configure a URL to receive event notifications'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint-name">Name *</Label>
              <Input
                id="endpoint-name"
                placeholder="My Webhook"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endpoint-url">Endpoint URL *</Label>
              <Input
                id="endpoint-url"
                type="url"
                placeholder="https://example.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must be HTTPS and publicly accessible
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endpoint-description">Description</Label>
              <Textarea
                id="endpoint-description"
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          
          {/* Event Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Events to Subscribe *</Label>
              <Button type="button" variant="ghost" size="sm" onClick={selectAllEvents}>
                Select All
              </Button>
            </div>
            
            <Accordion type="multiple" className="w-full">
              {Object.entries(eventGroups).map(([category, events]) => {
                const categoryEvents = events.map(e => e.event_type as WebhookEventType)
                const allSelected = categoryEvents.every(e => selectedEvents.includes(e))
                const someSelected = categoryEvents.some(e => selectedEvents.includes(e))
                
                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(e) => {
                            e.stopPropagation?.()
                            handleCategoryToggle(events)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                        />
                        <span className="capitalize font-medium">{category}</span>
                        <span className="text-muted-foreground text-sm">
                          ({categoryEvents.filter(e => selectedEvents.includes(e)).length}/{events.length})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-6">
                        {events.map((event) => (
                          <div key={event.event_type} className="flex items-start gap-2">
                            <Checkbox
                              id={event.event_type}
                              checked={selectedEvents.includes(event.event_type as WebhookEventType)}
                              onCheckedChange={() => handleEventToggle(event.event_type as WebhookEventType)}
                            />
                            <div className="grid gap-0.5">
                              <Label 
                                htmlFor={event.event_type}
                                className="text-sm cursor-pointer font-normal"
                              >
                                {event.event_type}
                              </Label>
                              {event.description && (
                                <p className="text-xs text-muted-foreground">
                                  {event.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
            
            {selectedEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Select at least one event to subscribe to
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim() || !url.trim() || selectedEvents.length === 0}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Endpoint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] `useApiKeys` hook CRUD operations work
- [ ] `useWebhooks` hook CRUD operations work
- [ ] `useIntegrations` hook CRUD operations work
- [ ] API key creation shows key only once
- [ ] API key copy to clipboard works
- [ ] API key revoke confirmation works
- [ ] Webhook endpoint creation with event selection works
- [ ] Webhook test sends request
- [ ] Webhook toggle enable/disable works
- [ ] Developer settings tabs navigate correctly
- [ ] Mobile responsive layouts work

---

## 🔄 Rollback Plan

If issues occur:

```bash
git checkout HEAD~1 -- src/components/ecommerce/views/api-keys-view.tsx
git checkout HEAD~1 -- src/components/ecommerce/views/webhooks-view.tsx
git checkout HEAD~1 -- src/components/ecommerce/views/developer-settings-view.tsx
git checkout HEAD~1 -- src/components/ecommerce/dialogs/
git checkout HEAD~1 -- src/hooks/ecommerce/use-integrations.ts
```

---

## 📝 Memory Bank Updates

After completion, update:
- `activeContext.md`: Add PHASE-ECOM-43B completion note, Wave 5 complete
- `progress.md`: Update Wave 5 section - All phases complete

---

## ✨ Success Criteria

- [ ] All integration hooks functional
- [ ] API key management fully works
- [ ] Webhook management fully works
- [ ] Key creation shows secret once
- [ ] Copy key to clipboard works
- [ ] Webhook test triggers delivery
- [ ] All views render correctly
- [ ] Mobile responsive
- [ ] Zero TypeScript errors

---

## 🎉 Wave 5 Completion Summary

With PHASE-ECOM-43B complete, Wave 5 delivers:

| Phase | Feature | Status |
|-------|---------|--------|
| ECOM-40 | Inventory Management | ✅ Complete |
| ECOM-41 | Analytics & Reports | ✅ Complete |
| ECOM-42 | Marketing Features | ✅ Complete |
| ECOM-43 | Integrations & Webhooks | ✅ Complete |

**Total Components Created:**
- 8 SQL migrations with 25+ tables
- 40+ server actions
- 15+ React hooks
- 30+ UI components
- 10+ utility files

**E-Commerce Module Now Includes:**
- Full inventory management with multi-location support
- Comprehensive analytics dashboard
- Flash sales, bundles, gift cards, loyalty programs
- API keys, webhooks, and third-party integrations
