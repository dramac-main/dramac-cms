/**
 * API Keys View Component
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * View for managing API keys with create, revoke, and rotate functionality.
 */
'use client'

import { useState } from 'react'
import {
  Key,
  Plus,
  MoreVertical,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Clock,
  Shield,
  AlertCircle
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
import { toast } from 'sonner'
import { useApiKeys } from '../../hooks/use-integrations'
import { CreateApiKeyDialog } from '../dialogs/create-api-key-dialog'
import { maskApiKey } from '../../lib/api-key-utils'
import type { ApiKey } from '../../types/integration-types'

interface ApiKeysViewProps {
  siteId: string
}

export function ApiKeysView({ siteId }: ApiKeysViewProps) {
  const { apiKeys, isLoading, create, revoke, rotate } = useApiKeys(siteId)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyPrefix = async (key: ApiKey) => {
    await navigator.clipboard.writeText(key.key_prefix + '...')
    setCopiedId(key.id)
    toast.success('Key prefix copied')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRevoke = async () => {
    if (!selectedKey) return
    const result = await revoke(selectedKey.id)
    if (result.success) {
      toast.success('API key revoked')
    } else {
      toast.error(result.error || 'Failed to revoke key')
    }
    setRevokeDialogOpen(false)
    setSelectedKey(null)
  }

  const handleRotate = async () => {
    if (!selectedKey) return
    const result = await rotate(selectedKey.id)
    if (result.success && result.key) {
      toast.success('New key generated. Copy it now - this is the only time you\'ll see it.')
      await navigator.clipboard.writeText(result.key.secret_key)
    } else {
      toast.error(result.error || 'Failed to rotate key')
    }
    setRotateDialogOpen(false)
    setSelectedKey(null)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const isExpired = (key: ApiKey) => {
    if (!key.expires_at) return false
    return new Date(key.expires_at) < new Date()
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
              <Skeleton key={i} className="h-12 w-full" />
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
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API keys for programmatic access to your store
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Key
          </Button>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No API Keys</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create an API key to access your store programmatically
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id} className={isExpired(key) ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name}</span>
                        {isExpired(key) && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                        {!key.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-0.5 rounded">
                          {maskApiKey(key.key_prefix + '...')}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyPrefix(key)}
                        >
                          {copiedId === key.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.slice(0, 3).map(scope => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                        {key.scopes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{key.scopes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(key.last_used_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {key.expires_at ? (
                          <>
                            {isExpired(key) ? (
                              <AlertCircle className="h-3 w-3 text-destructive" />
                            ) : (
                              <Shield className="h-3 w-3 text-muted-foreground" />
                            )}
                            {formatDate(key.expires_at)}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedKey(key)
                              setRotateDialogOpen(true)
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Rotate Key
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedKey(key)
                              setRevokeDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke Key
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

      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={create}
      />

      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke &quot;{selectedKey?.name}&quot;? 
              This action cannot be undone. Any applications using this key will 
              immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new key for &quot;{selectedKey?.name}&quot; and 
              invalidate the current one. The new key will be copied to your clipboard. 
              Update your applications immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRotate}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Rotate Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
