/**
 * Create Post Page
 * 
 * Phase EM-54: Social Media Management Module
 * Full-page post composer
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostComposerWrapper } from '@/modules/social-media/components'
import { getSocialAccounts } from '@/modules/social-media/actions/account-actions'
import { getCampaigns } from '@/modules/social-media/actions/campaign-actions'
import { getContentPillars } from '@/modules/social-media/actions/pillar-actions'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function ComposerContent({ siteId, userId }: { siteId: string; userId: string }) {
  const supabase = await createClient()
  
  // Get tenant ID from site
  const { data: site } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single()
  
  const tenantId = site?.agency_id || ''
  
  const accountsResult = await getSocialAccounts(siteId)
  const accounts = accountsResult.accounts || []
  
  const campaignsResult = await getCampaigns(siteId)
  const campaigns = campaignsResult.campaigns || []
  
  const pillarsResult = await getContentPillars(siteId)
  const contentPillars = pillarsResult.pillars || []

  return (
    <PostComposerWrapper
      siteId={siteId}
      tenantId={tenantId}
      userId={userId}
      accounts={accounts}
      campaigns={campaigns}
      contentPillars={contentPillars}
    />
  )
}

function ComposerSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <Skeleton className="h-[500px]" />
    </div>
  )
}

export default async function ComposePage({ params }: PageProps) {
  const { siteId } = await params
  
  // Auth guard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="container py-6">
      <Suspense fallback={<ComposerSkeleton />}>
        <ComposerContent siteId={siteId} userId={user.id} />
      </Suspense>
    </div>
  )
}
