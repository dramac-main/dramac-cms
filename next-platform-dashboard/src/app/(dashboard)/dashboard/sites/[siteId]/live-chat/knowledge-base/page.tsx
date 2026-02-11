/**
 * Knowledge Base Page
 *
 * PHASE LC-03: Article management for AI auto-responder
 */

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getKnowledgeBaseArticles } from '@/modules/live-chat/actions/knowledge-base-actions'
import { KnowledgeBasePageWrapper } from '@/modules/live-chat/components/wrappers/KnowledgeBasePageWrapper'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function KnowledgeBaseContent({ siteId }: { siteId: string }) {
  const result = await getKnowledgeBaseArticles(siteId)

  return (
    <KnowledgeBasePageWrapper
      articles={result.articles}
      siteId={siteId}
    />
  )
}

function KnowledgeBaseSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-16 rounded-lg" />
      <Skeleton className="h-10 w-80" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default async function KnowledgeBasePage({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <Suspense fallback={<KnowledgeBaseSkeleton />}>
        <KnowledgeBaseContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
