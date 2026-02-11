/**
 * Social Media Competitors Page
 * 
 * Phase SM-07: Missing Pages & Full Navigation
 * Server component for competitor tracking and analysis
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompetitorsPageWrapper } from '@/modules/social-media/components/CompetitorsPageWrapper'
import { getCompetitors, getCompetitorComparison } from '@/modules/social-media/actions/competitor-actions'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  params: Promise<{ siteId: string }>
}

function CompetitorsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  )
}

async function CompetitorsContent({ siteId }: { siteId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get tenant_id from sites table (agency_id) — never from social accounts
  const { data: site } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single()

  const [competitorsResult, comparisonResult] = await Promise.all([
    getCompetitors(siteId),
    getCompetitorComparison(siteId),
  ])

  return (
    <CompetitorsPageWrapper
      siteId={siteId}
      tenantId={site?.agency_id || ''}
      userId={user.id}
      competitors={competitorsResult.competitors}
      comparison={comparisonResult.comparison}
    />
  )
}

export default async function CompetitorsPageRoute({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <Suspense fallback={<CompetitorsSkeleton />}>
        <CompetitorsContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
