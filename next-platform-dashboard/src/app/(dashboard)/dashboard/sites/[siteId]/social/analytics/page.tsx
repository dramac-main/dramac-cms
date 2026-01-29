import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isModuleEnabledForSite } from '@/lib/actions/sites'
import { getSocialAccounts } from '@/modules/social-media/actions/account-actions'
import { getAnalyticsOverview, getTopPosts, getBestTimesToPost } from '@/modules/social-media/actions/analytics-actions'
import { SocialAnalyticsPage } from '@/modules/social-media/components/SocialAnalyticsPage'

interface PageProps {
  params: Promise<{ siteId: string }>
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { siteId } = await params
  
  // Auth check handled by layout
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Module access check
  const hasAccess = await isModuleEnabledForSite(siteId, 'social-media')
  if (!hasAccess) {
    redirect(`/dashboard/sites/${siteId}?tab=modules`)
  }
  
  // Get accounts and analytics data
  const [accountsResult, analyticsResult, topPostsResult, bestTimesResult] = await Promise.all([
    getSocialAccounts(siteId),
    getAnalyticsOverview(siteId),
    getTopPosts(siteId, { limit: 5 }),
    getBestTimesToPost(siteId),
  ])
  
  return (
    <div className="container py-6">
      <SocialAnalyticsPage 
        siteId={siteId}
        accounts={accountsResult.accounts}
        overview={analyticsResult.overview}
        topPosts={topPostsResult.posts}
        bestTimes={bestTimesResult.bestTimes}
      />
    </div>
  )
}
