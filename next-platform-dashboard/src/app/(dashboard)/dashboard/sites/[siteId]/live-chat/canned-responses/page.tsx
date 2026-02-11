/**
 * Canned Responses Page
 *
 * PHASE LC-03: Quick reply template management
 */

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getCannedResponses } from '@/modules/live-chat/actions/canned-response-actions'
import { CannedResponsesPageWrapper } from '@/modules/live-chat/components/wrappers/CannedResponsesPageWrapper'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function CannedResponsesContent({ siteId }: { siteId: string }) {
  const result = await getCannedResponses(siteId)

  return (
    <CannedResponsesPageWrapper
      responses={result.responses}
      siteId={siteId}
    />
  )
}

function CannedResponsesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-10 w-80" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default async function CannedResponsesPage({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <Suspense fallback={<CannedResponsesSkeleton />}>
        <CannedResponsesContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
