/**
 * Create API Key Dialog
 * 
 * Phase ECOM-43B: Integrations & Webhooks - UI Components
 * 
 * Dialog for creating new API keys with scope selection.
 */
'use client'

import { useState, useEffect } from 'react'
import { Loader2, Key, Copy, Check, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { CreateApiKeyInput, ApiKeyScope, ApiKeyWithSecret } from '../../types/integration-types'
import { ALL_SCOPES, SCOPE_DESCRIPTIONS } from '../../lib/api-key-utils'

interface CreateApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateApiKeyInput) => Promise<{ success: boolean; key?: ApiKeyWithSecret; error?: string }>
}

export function CreateApiKeyDialog({ open, onOpenChange, onSubmit }: CreateApiKeyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdKey, setCreatedKey] = useState<ApiKeyWithSecret | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<ApiKeyScope[]>(['read:products'])
  const [expiresAt, setExpiresAt] = useState('')
  const [allowedIps, setAllowedIps] = useState('')
  const [allowedOrigins, setAllowedOrigins] = useState('')

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setCreatedKey(null)
      setCopied(false)
    }
  }, [open])

  const resetForm = () => {
    setName('')
    setSelectedScopes(['read:products'])
    setExpiresAt('')
    setAllowedIps('')
    setAllowedOrigins('')
    setCreatedKey(null)
    setCopied(false)
  }

  const handleScopeToggle = (scope: ApiKeyScope) => {
    setSelectedScopes(prev => 
      prev.includes(scope) 
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    )
  }

  const handleCopy = async () => {
    if (createdKey?.secret_key) {
      await navigator.clipboard.writeText(createdKey.secret_key)
      setCopied(true)
      toast.success('API key copied to clipboard')
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    if (selectedScopes.length === 0) {
      toast.error('Please select at least one scope')
      return
    }

    setIsSubmitting(true)
    
    try {
      const input: CreateApiKeyInput = {
        name: name.trim(),
        scopes: selectedScopes,
        expires_at: expiresAt || undefined,
        allowed_ips: allowedIps ? allowedIps.split(',').map(ip => ip.trim()).filter(Boolean) : undefined,
        allowed_origins: allowedOrigins ? allowedOrigins.split(',').map(o => o.trim()).filter(Boolean) : undefined
      }
      
      const result = await onSubmit(input)
      
      if (result.success && result.key) {
        setCreatedKey(result.key)
        toast.success('API key created successfully')
      } else {
        toast.error(result.error || 'Failed to create API key')
      }
    } catch {
      toast.error('Failed to create API key')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  // Show key reveal screen after creation
  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-green-500" />
              API Key Created
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="destructive" className="border-orange-500 bg-orange-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This is the only time you&apos;ll see this key. 
                Copy it now and store it securely. You won&apos;t be able to see it again.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <Input 
                  value={createdKey.secret_key} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p>{createdKey.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Scopes</Label>
                <p>{createdKey.scopes.join(', ')}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Create API Key
          </DialogTitle>
          <DialogDescription>
            Create a new API key for programmatic access to your store data.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="My Integration"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A descriptive name to identify this key
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Scopes *</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_SCOPES.map((scope) => (
                <div key={scope} className="flex items-center space-x-2">
                  <Checkbox
                    id={scope}
                    checked={selectedScopes.includes(scope)}
                    onCheckedChange={() => handleScopeToggle(scope)}
                  />
                  <label 
                    htmlFor={scope} 
                    className="text-sm cursor-pointer flex-1"
                  >
                    <span className="font-medium">{scope}</span>
                    <p className="text-xs text-muted-foreground">
                      {SCOPE_DESCRIPTIONS[scope]}
                    </p>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expires">Expiration (optional)</Label>
            <Input
              id="expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ips">Allowed IPs (optional)</Label>
            <Input
              id="ips"
              placeholder="192.168.1.1, 10.0.0.0/8"
              value={allowedIps}
              onChange={(e) => setAllowedIps(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of IP addresses or CIDR ranges
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="origins">Allowed Origins (optional)</Label>
            <Input
              id="origins"
              placeholder="https://myapp.com, https://api.myapp.com"
              value={allowedOrigins}
              onChange={(e) => setAllowedOrigins(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of allowed CORS origins
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
