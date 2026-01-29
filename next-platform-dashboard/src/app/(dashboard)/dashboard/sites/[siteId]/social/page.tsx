/**
 * Social Media Dashboard Page
 * 
 * Phase EM-54: Social Media Management Module
 * Main entry point for social media management
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SocialDashboard } from '@/modules/social-media/components'
import { getSocialAccounts } from '@/modules/social-media/actions/account-actions'
import { getPosts } from '@/modules/social-media/actions/post-actions'
import { getAnalyticsOverview } from '@/modules/social-media/actions/analytics-actions'
import { getInboxCounts } from '@/modules/social-media/actions/inbox-actions'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function SocialDashboardContent({ siteId }: { siteId: string }) {
  // Fetch all data in parallel
  const [
    accountsResult,
    scheduledPostsResult,
    recentPostsResult,
    analyticsResult,
    inboxCountsResult,
  ] = await Promise.all([
    getSocialAccounts(siteId),
    getPosts(siteId, { status: 'scheduled', limit: 10 }),
    getPosts(siteId, { status: 'published', limit: 10 }),
    getAnalyticsOverview(siteId),
    getInboxCounts(siteId),
  ])

  const accounts = accountsResult.accounts || []
  const scheduledPosts = scheduledPostsResult.posts || []
  const recentPosts = recentPostsResult.posts || []
  const analytics = analyticsResult.overview || null
  const inboxCounts = inboxCountsResult.counts || { new: 0, read: 0, replied: 0, flagged: 0, total: 0 }

  // Get pending approvals count
  const pendingResult = await getPosts(siteId, { status: 'pending_approval' })
  const pendingApprovals = pendingResult.posts?.length || 0

  return (
    <SocialDashboard
      accounts={accounts}
      scheduledPosts={scheduledPosts}
      recentPosts={recentPosts}
      analytics={analytics}
      inboxCount={inboxCounts.new}
      pendingApprovals={pendingApprovals}
      onCreatePost={() => {
        // Client-side navigation handled by client wrapper
      }}
      onViewCalendar={() => {}}
      onViewInbox={() => {}}
      onViewAnalytics={() => {}}
      onRefresh={() => {}}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}

export default async function SocialMediaPage({ params }: PageProps) {
  const { siteId } = await params
  
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container py-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <SocialDashboardContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
