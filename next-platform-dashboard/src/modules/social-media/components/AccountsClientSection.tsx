'use client'

/**
 * Accounts Client Section
 * 
 * PHASE-SM-01: Client component for OAuth connect buttons,
 * Bluesky form, Mastodon instance input, and account action buttons.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  RefreshCw,
  Trash2,
  Settings,
  CircleCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { PLATFORM_CONFIGS } from '../types'
import type { SocialAccount, SocialPlatform } from '../types'
import {
  refreshAccountToken,
  syncAccountStats,
  disconnectSocialAccount,
  connectBlueskyAccount,
  registerMastodonApp,
} from '../actions/account-actions'

// ============================================================================
// TYPES
// ============================================================================

type AccountsClientSectionProps =
  | {
      mode: 'connect-panel'
      siteId: string
      tenantId: string
      accounts?: SocialAccount[]
      account?: never
    }
  | {
      mode: 'account-actions'
      siteId: string
      tenantId: string
      account: SocialAccount
      accounts?: never
    }

// ============================================================================
// PLATFORMS
// ============================================================================

const OAUTH_PLATFORMS = [
  { id: 'facebook' as SocialPlatform, name: 'Facebook', icon: 'Fb', color: '#1877F2', desc: 'Pages & Groups' },
  { id: 'instagram' as SocialPlatform, name: 'Instagram', icon: 'Ig', color: '#E4405F', desc: 'Business & Creator' },
  { id: 'twitter' as SocialPlatform, name: 'X (Twitter)', icon: 'Tw', color: '#000000', desc: 'Posts & Threads' },
  { id: 'linkedin' as SocialPlatform, name: 'LinkedIn', icon: 'Li', color: '#0A66C2', desc: 'Profile & Company' },
  { id: 'tiktok' as SocialPlatform, name: 'TikTok', icon: 'Tt', color: '#000000', desc: 'Videos & Analytics' },
  { id: 'youtube' as SocialPlatform, name: 'YouTube', icon: 'Yt', color: '#FF0000', desc: 'Channel & Videos' },
  { id: 'pinterest' as SocialPlatform, name: 'Pinterest', icon: 'Pi', color: '#E60023', desc: 'Pins & Boards' },
  { id: 'threads' as SocialPlatform, name: 'Threads', icon: 'Th', color: '#000000', desc: 'Posts & Replies' },
]

// ============================================================================
// CONNECT PANEL
// ============================================================================

function ConnectPanel({
  siteId,
  tenantId,
  accounts = [],
}: {
  siteId: string
  tenantId: string
  accounts: SocialAccount[]
}) {
  const [blueskyHandle, setBlueskyHandle] = useState('')
  const [blueskyPassword, setBlueskyPassword] = useState('')
  const [mastodonInstance, setMastodonInstance] = useState('')
  const [isPending, startTransition] = useTransition()
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null)
  const router = useRouter()

  const handleOAuthConnect = (platformId: string) => {
    setLoadingPlatform(platformId)
    // Redirect to OAuth initiation
    window.location.href = `/api/social/oauth/${platformId}?siteId=${siteId}&tenantId=${tenantId}`
  }

  const handleBlueskyConnect = () => {
    if (!blueskyHandle || !blueskyPassword) {
      toast.error('Please enter both handle and app password')
      return
    }
    setLoadingPlatform('bluesky')
    startTransition(async () => {
      const result = await connectBlueskyAccount(siteId, tenantId, '', {
        handle: blueskyHandle,
        appPassword: blueskyPassword,
      })
      setLoadingPlatform(null)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Bluesky account connected!')
        setBlueskyHandle('')
        setBlueskyPassword('')
        router.refresh()
      }
    })
  }

  const handleMastodonConnect = () => {
    if (!mastodonInstance) {
      toast.error('Please enter your Mastodon instance URL')
      return
    }
    setLoadingPlatform('mastodon')
    const instanceUrl = mastodonInstance.startsWith('https://')
      ? mastodonInstance
      : `https://${mastodonInstance}`

    startTransition(async () => {
      const result = await registerMastodonApp(instanceUrl, siteId, tenantId, '')
      setLoadingPlatform(null)
      if (result.authorizeUrl) {
        window.location.href = result.authorizeUrl
      } else {
        toast.error(result.error || 'Failed to register with Mastodon instance')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Connect a New Account</CardTitle>
        <CardDescription>
          Choose a platform to connect. You&apos;ll be redirected to authorize access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* OAuth platforms */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {OAUTH_PLATFORMS.map((platform) => {
            const isConnected = accounts.some(
              (a) => a.platform === platform.id && a.status === 'active',
            )
            const isLoading = loadingPlatform === platform.id

            return (
              <Button
                key={platform.id}
                variant="outline"
                className="relative h-auto flex-col py-4 hover:border-primary hover:bg-primary/5"
                onClick={() => handleOAuthConnect(platform.id)}
                disabled={isLoading}
              >
                {isConnected && (
                  <div className="absolute top-2 left-2">
                    <CircleCheck className="h-4 w-4 text-green-600" />
                  </div>
                )}
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin mb-1" />
                ) : (
                  <span className="text-2xl mb-1 font-bold text-muted-foreground">
                    {platform.icon}
                  </span>
                )}
                <span className="font-semibold text-sm">{platform.name}</span>
                <span className="text-xs text-muted-foreground">{platform.desc}</span>
              </Button>
            )
          })}
        </div>

        {/* Bluesky */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#0085FF]">Bs</span>
            <h4 className="font-medium">Bluesky</h4>
            {accounts.some((a) => a.platform === 'bluesky' && a.status === 'active') && (
              <CircleCheck className="h-4 w-4 text-green-600" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Connect with your handle and an App Password (create one in Bluesky Settings → App Passwords).
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="bsky-handle">Handle</Label>
              <Input
                id="bsky-handle"
                placeholder="user.bsky.social"
                value={blueskyHandle}
                onChange={(e) => setBlueskyHandle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bsky-password">App Password</Label>
              <Input
                id="bsky-password"
                type="password"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                value={blueskyPassword}
                onChange={(e) => setBlueskyPassword(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleBlueskyConnect}
            disabled={loadingPlatform === 'bluesky' || isPending}
            size="sm"
          >
            {loadingPlatform === 'bluesky' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Connect Bluesky
          </Button>
        </div>

        {/* Mastodon */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#6364FF]">Ms</span>
            <h4 className="font-medium">Mastodon</h4>
            {accounts.some((a) => a.platform === 'mastodon' && a.status === 'active') && (
              <CircleCheck className="h-4 w-4 text-green-600" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your Mastodon instance URL to connect via OAuth.
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="mastodon-instance">Instance URL</Label>
              <Input
                id="mastodon-instance"
                placeholder="mastodon.social"
                value={mastodonInstance}
                onChange={(e) => setMastodonInstance(e.target.value)}
              />
            </div>
            <Button
              onClick={handleMastodonConnect}
              disabled={loadingPlatform === 'mastodon' || isPending}
              size="sm"
            >
              {loadingPlatform === 'mastodon' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Connect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// ACCOUNT ACTIONS (Sync / Refresh / Disconnect)
// ============================================================================

function AccountActions({
  siteId,
  account,
}: {
  siteId: string
  account: SocialAccount
}) {
  const [isPending, startTransition] = useTransition()
  const [showDisconnect, setShowDisconnect] = useState(false)
  const router = useRouter()

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncAccountStats(account.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Account synced!')
        router.refresh()
      }
    })
  }

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshAccountToken(account.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Token refreshed!')
        router.refresh()
      }
    })
  }

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectSocialAccount(account.id, siteId)
      setShowDisconnect(false)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Account disconnected')
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      {account.status === 'expired' ? (
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Reconnect
        </Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={handleSync} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      )}

      <Dialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect <strong>{account.accountName}</strong>?
              This will remove the connection but won&apos;t affect your {PLATFORM_CONFIGS[account.platform]?.name} account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnect(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnect} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// EXPORT
// ============================================================================

export function AccountsClientSection(props: AccountsClientSectionProps) {
  if (props.mode === 'connect-panel') {
    return (
      <ConnectPanel
        siteId={props.siteId}
        tenantId={props.tenantId}
        accounts={props.accounts || []}
      />
    )
  }

  return (
    <AccountActions
      siteId={props.siteId}
      account={props.account}
    />
  )
}
