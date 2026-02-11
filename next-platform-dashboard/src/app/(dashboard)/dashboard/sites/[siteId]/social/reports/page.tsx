/**
 * Social Media Reports Page
 * Phase SM-07 + SM-08: Reports route
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/server'
import { ReportsPageWrapper } from '@/modules/social-media/components/ReportsPageWrapper'
import { getReports } from '@/modules/social-media/actions/report-actions'

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

async function ReportsContent({ siteId }: { siteId: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site } = await supabase
    .from('sites')
    .select('agency_id')
    .eq('id', siteId)
    .single()

  const { reports } = await getReports(siteId)

  return (
    <div className="container py-6">
      <ReportsPageWrapper
        siteId={siteId}
        tenantId={site?.agency_id || ''}
        userId={user.id}
        reports={reports ?? []}
      />
    </div>
  )
}

export default async function ReportsRoute({
  params,
}: {
  params: Promise<{ siteId: string }>
}) {
  const { siteId } = await params
  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent siteId={siteId} />
    </Suspense>
  )
}
