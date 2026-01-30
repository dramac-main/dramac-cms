'use client'

/**
 * Social Dashboard Wrapper
 * 
 * Client wrapper that handles navigation callbacks internally
 * This prevents passing functions from Server Component to Client Component
 * 
 * Updated in PHASE-UI-11A to use enhanced dashboard with modern UI
 */

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { SocialDashboardEnhanced } from './SocialDashboardEnhanced'
import type { SocialAccount, SocialPost, AnalyticsOverview } from '../types'

interface SocialDashboardWrapperProps {
  siteId: string
  accounts: SocialAccount[]
  scheduledPosts: SocialPost[]
  recentPosts: SocialPost[]
  analytics: AnalyticsOverview | null
  inboxCount: number
  pendingApprovals: number
}

export function SocialDashboardWrapper({
  siteId,
  accounts,
  scheduledPosts,
  recentPosts,
  analytics,
  inboxCount,
  pendingApprovals,
}: SocialDashboardWrapperProps) {
  const router = useRouter()

  const handleCreatePost = useCallback(() => {
    router.push(`/dashboard/sites/${siteId}/social/compose`)
  }, [router, siteId])

  const handleViewCalendar = useCallback(() => {
    router.push(`/dashboard/sites/${siteId}/social/calendar`)
  }, [router, siteId])

  const handleViewInbox = useCallback(() => {
    router.push(`/dashboard/sites/${siteId}/social/inbox`)
  }, [router, siteId])

  const handleViewAnalytics = useCallback(() => {
    router.push(`/dashboard/sites/${siteId}/social/analytics`)
  }, [router, siteId])

  const handleRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <SocialDashboardEnhanced
      siteId={siteId}
      accounts={accounts}
      scheduledPosts={scheduledPosts}
      recentPosts={recentPosts}
      analytics={analytics}
      inboxCount={inboxCount}
      pendingApprovals={pendingApprovals}
      onCreatePost={handleCreatePost}
      onViewCalendar={handleViewCalendar}
      onViewInbox={handleViewInbox}
      onViewAnalytics={handleViewAnalytics}
      onRefresh={handleRefresh}
    />
  )
}
