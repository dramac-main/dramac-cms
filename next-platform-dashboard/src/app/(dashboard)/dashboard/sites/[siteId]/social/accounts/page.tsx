/**
 * Social Accounts Management Page
 * 
 * Phase EM-54: Social Media Management Module
 * Manage connected social media accounts
 */

import { Suspense } from 'react'
import { getSocialAccounts } from '@/modules/social-media/actions/account-actions'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  RefreshCw, 
  Trash2, 
  AlertCircle,
  CircleCheck,
  Clock,
  Settings
} from 'lucide-react'
import { PLATFORM_CONFIGS } from '@/modules/social-media/types'
import type { SocialAccount, SocialPlatform } from '@/modules/social-media/types'

interface PageProps {
  params: Promise<{ siteId: string }>
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

async function AccountsContent({ siteId }: { siteId: string }) {
  const result = await getSocialAccounts(siteId)
  const accounts = result.accounts || []

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: 'Fb', color: '#1877F2', desc: 'Pages & Groups' },
    { id: 'instagram', name: 'Instagram', icon: 'Ig', color: '#E4405F', desc: 'Business & Creator' },
    { id: 'twitter', name: 'X (Twitter)', icon: 'Tw', color: '#000000', desc: 'Posts & Threads' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'Li', color: '#0A66C2', desc: 'Profile & Company' },
    { id: 'tiktok', name: 'TikTok', icon: 'Tt', color: '#000000', desc: 'Videos & Analytics' },
    { id: 'youtube', name: 'YouTube', icon: 'Yt', color: '#FF0000', desc: 'Channel & Videos' },
    { id: 'pinterest', name: 'Pinterest', icon: 'Pi', color: '#E60023', desc: 'Pins & Boards' },
    { id: 'threads', name: 'Threads', icon: 'Th', color: '#000000', desc: 'Posts & Replies' },
    { id: 'bluesky', name: 'Bluesky', icon: 'Bs', color: '#0085FF', desc: 'Posts' },
    { id: 'mastodon', name: 'Mastodon', icon: 'Ms', color: '#6364FF', desc: 'Posts' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Connected Accounts</h1>
          <p className="text-muted-foreground">
            Manage your social media accounts and connections
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Clock className="h-4 w-4 mr-1" />
          OAuth Integration Available
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
                      <div 
                        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: getPlatformColor(account.platform) }}
                      >
                        {getPlatformIcon(account.platform)}
                      </div>
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
                    {/* Stats */}
                    <div className="text-right">
                      <p className="font-semibold">{formatNumber(account.followersCount || 0)}</p>
                      <p className="text-xs text-muted-foreground">followers</p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {account.status === 'expired' ? (
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reconnect
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connect a New Account</CardTitle>
          <CardDescription>
            Choose a platform to connect. You&apos;ll be redirected to authorize access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {platforms.map((platform) => {
              const isConnected = accounts.some(
                a => a.platform === platform.id && a.status === 'active'
              )
              
              return (
                <div
                  key={platform.id}
                  className="relative flex flex-col items-center py-4 px-3 rounded-md border border-input hover:bg-muted/50 transition-colors cursor-default"
                >
                  <Badge variant="secondary" className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0">
                    Soon
                  </Badge>
                  {isConnected && (
                    <div className="absolute top-2 left-2">
                      <CircleCheck className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  <span className="text-2xl mb-1">{platform.icon}</span>
                  <span className="font-medium text-sm">{platform.name}</span>
                  <span className="text-xs text-muted-foreground">{platform.desc}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

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

export default async function AccountsPage({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <Suspense fallback={<AccountsSkeleton />}>
        <AccountsContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
