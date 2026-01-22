'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Code2, Globe, Braces, RefreshCw, AlertTriangle, Shield } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { generateEmbedCode, createEmbedToken } from '@/lib/modules/embed/embed-service'
import { revokeEmbedToken, checkTokenStatus, regenerateEmbedToken } from '@/lib/modules/embed/embed-auth'
import { toast } from 'sonner'

interface EmbedCodeGeneratorProps {
  moduleId: string
  siteId: string
  moduleName: string
  onTokenRevoked?: () => void
}

export function EmbedCodeGenerator({ 
  moduleId, 
  siteId, 
  moduleName,
  onTokenRevoked 
}: EmbedCodeGeneratorProps) {
  const [embedCodes, setEmbedCodes] = useState<{
    iframe: string
    webComponent: string
    javascript: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [tokenStatus, setTokenStatus] = useState<{
    exists: boolean
    isRevoked: boolean
    isExpired: boolean
    expiresAt: Date | null
  } | null>(null)

  const loadEmbedCodes = useCallback(async (forceNew = false) => {
    setLoading(true)
    try {
      // Check existing token status
      const status = await checkTokenStatus(siteId, moduleId)
      setTokenStatus(status)

      let token: string

      // Generate new token if needed
      if (!status.exists || status.isRevoked || status.isExpired || forceNew) {
        const { token: newToken } = await createEmbedToken(siteId, moduleId, 365)
        token = newToken
        // Refresh status
        const newStatus = await checkTokenStatus(siteId, moduleId)
        setTokenStatus(newStatus)
      } else {
        // Use existing token - regenerate to get the actual token value
        const { token: existingToken } = await createEmbedToken(siteId, moduleId, 365)
        token = existingToken
      }

      // Generate codes
      const codes = await generateEmbedCode(moduleId, siteId, token)
      setEmbedCodes(codes)
    } catch (_error) {
      console.error('Failed to generate embed codes:', _error)
      toast.error('Failed to generate embed codes')
    } finally {
      setLoading(false)
    }
  }, [moduleId, siteId])

  useEffect(() => {
    loadEmbedCodes()
  }, [loadEmbedCodes])

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleRegenerateToken = async () => {
    setRegenerating(true)
    try {
      const { token } = await regenerateEmbedToken(siteId, moduleId, 365)
      const codes = await generateEmbedCode(moduleId, siteId, token)
      setEmbedCodes(codes)
      const newStatus = await checkTokenStatus(siteId, moduleId)
      setTokenStatus(newStatus)
      toast.success('Embed token regenerated successfully')
    } catch (_error) {
      toast.error('Failed to regenerate token')
    } finally {
      setRegenerating(false)
    }
  }

  const handleRevokeToken = async () => {
    setRevoking(true)
    try {
      const success = await revokeEmbedToken(siteId, moduleId)
      if (success) {
        setEmbedCodes(null)
        setTokenStatus(prev => prev ? { ...prev, isRevoked: true } : null)
        toast.success('Embed token revoked successfully')
        onTokenRevoked?.()
      } else {
        toast.error('Failed to revoke token')
      }
    } catch (_error) {
      toast.error('Failed to revoke token')
    } finally {
      setRevoking(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            <span className="text-muted-foreground">Loading embed codes...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (tokenStatus?.isRevoked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Embed {moduleName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Token Revoked</AlertTitle>
            <AlertDescription>
              The embed token for this module has been revoked. Generate a new token to enable embedding.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => loadEmbedCodes(true)} 
            className="mt-4"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate New Token
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!embedCodes) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium">Failed to generate embed codes</p>
            <Button 
              onClick={() => loadEmbedCodes(true)} 
              variant="outline" 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Embed {moduleName}
            </CardTitle>
            <CardDescription className="mt-1">
              Use any of these methods to embed this module on external websites
            </CardDescription>
          </div>
          {tokenStatus?.expiresAt && (
            <Badge variant="secondary" className="text-xs">
              Expires: {new Date(tokenStatus.expiresAt).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="iframe">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="iframe" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">iFrame</span>
            </TabsTrigger>
            <TabsTrigger value="webcomponent" className="gap-2">
              <Code2 className="h-4 w-4" />
              <span className="hidden sm:inline">Web Component</span>
            </TabsTrigger>
            <TabsTrigger value="javascript" className="gap-2">
              <Braces className="h-4 w-4" />
              <span className="hidden sm:inline">JavaScript SDK</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="iframe" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The simplest way to embed. Works on any website including WordPress, Wix, Squarespace, etc.
              </p>
              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code className="text-xs sm:text-sm">{embedCodes.iframe}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(embedCodes.iframe, 'iframe')}
                >
                  {copied === 'iframe' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Pros:</strong> Zero configuration, works everywhere
                <br />
                <strong>Cons:</strong> Limited styling control
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webcomponent" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use Web Components for better integration with modern frameworks like React, Vue, or Angular.
              </p>
              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code className="text-xs sm:text-sm">{embedCodes.webComponent}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(embedCodes.webComponent, 'webcomponent')}
                >
                  {copied === 'webcomponent' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Pros:</strong> Native browser support, encapsulated styling
                <br />
                <strong>Cons:</strong> Requires JavaScript enabled
              </div>
            </div>
          </TabsContent>

          <TabsContent value="javascript" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Full SDK for deep integration with event handling, settings updates, and more control.
              </p>
              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm max-h-75">
                  <code className="text-xs sm:text-sm">{embedCodes.javascript}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(embedCodes.javascript, 'javascript')}
                >
                  {copied === 'javascript' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Pros:</strong> Full API access, event handling, dynamic updates
                <br />
                <strong>Cons:</strong> More setup required
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Security section */}
        <div className="mt-6 space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Security Note</AlertTitle>
            <AlertDescription>
              The embed token expires in 1 year. You can regenerate it anytime from here.
              If you suspect the token has been compromised, revoke it immediately.
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateToken}
              disabled={regenerating}
            >
              {regenerating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Regenerate Token
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeToken}
              disabled={revoking}
            >
              {revoking ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Revoke Token
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
