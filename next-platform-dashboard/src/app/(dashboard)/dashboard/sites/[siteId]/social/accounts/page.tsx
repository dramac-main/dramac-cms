/**
 * Social Accounts Management Page
 * 
 * PHASE-SM-01: OAuth & Account Integration
 * Connect, manage, and monitor social media accounts.
 */

import { Suspense } from 'react'
import { getSocialAccounts } from '@/modules/social-media/actions/account-actions'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  AlertCircle,
  CircleCheck,
  Clock,
} from 'lucide-react'
import { PLATFORM_CONFIGS } from '@/modules/social-media/types'
import type { SocialAccount, SocialPlatform } from '@/modules/social-media/types'
import { AccountsClientSection } from '@/modules/social-media/components/AccountsClientSection'

interface PageProps {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{ connected?: string; error?: string; message?: string }>
}

function getPlatformIcon(platform: SocialPlatform) {
  return PLATFORM_CONFIGS[platform]?.icon || 'App'
}

function getPlatformColor(platform: SocialPlatform) {
  return PLATFORM_CONFIGS[platform]?.color || '#6B7280'
}

function getPlatformName(platform: SocialPlatform) {
  return PLATFORM_CONFIGS[platform]?.name || platform
}

function getStatusBadge(status: SocialAccount['status']) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="bg-green-600">
          <CircleCheck className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    case 'expired':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Token Expired
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      )
    case 'disconnected':
      return (
        <Badge variant="secondary">
          Disconnected
        </Badge>
      )
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      )
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

async function AccountsContent({
  siteId,
  connected,
  errorType,
  errorMessage,
}: {
  siteId: string
  connected?: string
  errorType?: string
  errorMessage?: string
}) {
  const result = await getSocialAccounts(siteId)
  const accounts = result.accounts || []

  // Get tenantId from site's agency_id
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
    return null // help TypeScript narrow
  }

  const { data: site } = await (supabase as any)
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single()
  const tenantId = site?.agency_id || ''

  return (
    <div className="space-y-8">
      {/* Success banner */}
      {connected && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CircleCheck className="h-5 w-5 text-green-600" />
              <p className="font-medium text-green-900 dark:text-green-100">
                Successfully connected your {PLATFORM_CONFIGS[connected as SocialPlatform]?.name || connected} account!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error banner */}
      {errorType && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">
                  Connection failed
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {errorMessage || errorType}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Connected Accounts</h1>
          <p className="text-muted-foreground">
            Manage your social media accounts and connections
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <CircleCheck className="h-4 w-4 mr-1" />
          OAuth Ready
        </Badge>
      </div>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Accounts</CardTitle>
            <CardDescription>
              {accounts.filter(a => a.status === 'active').length} of {accounts.length} accounts active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={account.accountAvatar || undefined} />
                        <AvatarFallback 
                          style={{ backgroundColor: getPlatformColor(account.platform) }}
                          className="text-lg"
                        >
                          {getPlatformIcon(account.platform)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{account.accountName}</h3>
                        {getStatusBadge(account.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {account.accountHandle ? `@${account.accountHandle}` : getPlatformName(account.platform)}
                        {' · '}
                        {account.accountType}
                      </p>
                      {account.lastSyncedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last synced: {new Date(account.lastSyncedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold">{formatNumber(account.followersCount || 0)}</p>
                      <p className="text-xs text-muted-foreground">followers</p>
                    </div>
                    
                    {/* Client-side action buttons */}
                    <AccountsClientSection
                      mode="account-actions"
                      siteId={siteId}
                      tenantId={tenantId}
                      account={account}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connect New Account — client component with OAuth */}
      <AccountsClientSection
        mode="connect-panel"
        siteId={siteId}
        tenantId={tenantId}
        userId={user.id}
        accounts={accounts}
      />

      {/* OAuth Information */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">About Account Connections</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                When you connect an account, you&apos;ll be redirected to the platform to authorize access. 
                We only request the permissions needed to post content and read analytics. 
                Your login credentials are never stored - we only store access tokens that can be revoked at any time.
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-3 space-y-1">
                <li>• <strong>Facebook/Instagram:</strong> Requires a Business or Creator account</li>
                <li>• <strong>TikTok:</strong> Requires a TikTok Business account</li>
                <li>• <strong>LinkedIn:</strong> Can connect personal profile or company pages</li>
                <li>• <strong>YouTube:</strong> Connects to your YouTube channel</li>
                <li>• <strong>Bluesky:</strong> Uses handle + app password (create one in Settings → App Passwords)</li>
                <li>• <strong>Mastodon:</strong> Enter your instance URL to connect via OAuth</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AccountsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-48" />
    </div>
  )
}

export default async function AccountsPage({ params, searchParams }: PageProps) {
  const { siteId } = await params
  const sp = await searchParams

  return (
    <div className="container py-6">
      <Suspense fallback={<AccountsSkeleton />}>
        <AccountsContent
          siteId={siteId}
          connected={sp.connected}
          errorType={sp.error}
          errorMessage={sp.message}
        />
      </Suspense>
    </div>
  )
}
