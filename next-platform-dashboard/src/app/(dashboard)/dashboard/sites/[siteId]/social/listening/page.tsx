/**
 * Social Listening Page
 * 
 * Phase SM-07: Missing Pages & Full Navigation
 * Server component for the listening dashboard
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SocialListeningWrapper } from '@/modules/social-media/components/SocialListeningWrapper'
import { getListeningKeywords, getBrandMentions, getMentionStats } from '@/modules/social-media/actions/listening-actions'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  params: Promise<{ siteId: string }>
}

function ListeningSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80" />
        <Skeleton className="h-80 lg:col-span-2" />
      </div>
    </div>
  )
}

async function ListeningContent({ siteId }: { siteId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get tenant_id from sites table (agency_id) — never from social accounts
  const { data: site } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single()

  const [keywordsResult, mentionsResult, statsResult] = await Promise.all([
    getListeningKeywords(siteId),
    getBrandMentions(siteId, { limit: 50 }),
    getMentionStats(siteId),
  ])

  return (
    <SocialListeningWrapper
      siteId={siteId}
      tenantId={site?.agency_id || ''}
      userId={user.id}
      keywords={keywordsResult.keywords}
      mentions={mentionsResult.mentions}
      stats={statsResult.stats}
    />
  )
}

export default async function ListeningPage({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <Suspense fallback={<ListeningSkeleton />}>
        <ListeningContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
