/**
 * Conversations List Page
 *
 * PHASE LC-03: Filterable, paginated conversation list with realtime updates
 */

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getConversations } from '@/modules/live-chat/actions/conversation-actions'
import { getAgents } from '@/modules/live-chat/actions/agent-actions'
import { getDepartments } from '@/modules/live-chat/actions/department-actions'
import { ConversationsPageWrapper } from '@/modules/live-chat/components/wrappers/ConversationsPageWrapper'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function ConversationsContent({ siteId }: { siteId: string }) {
  const [conversationsResult, agentsResult, departmentsResult] =
    await Promise.all([
      getConversations(siteId, {}, 1, 20),
      getAgents(siteId),
      getDepartments(siteId),
    ])

  return (
    <ConversationsPageWrapper
      initialConversations={conversationsResult.conversations}
      total={conversationsResult.total}
      agents={agentsResult.agents}
      departments={departmentsResult.departments}
      siteId={siteId}
    />
  )
}

function ConversationsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-14 rounded-lg" />
      <div className="space-y-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-none" />
        ))}
      </div>
    </div>
  )
}

export default async function ConversationsPage({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <Suspense fallback={<ConversationsSkeleton />}>
        <ConversationsContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
