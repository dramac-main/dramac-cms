/**
 * Live Chat Overview Page
 *
 * PHASE LC-03: Agent Dashboard — Main entry point
 */

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getConversationStats, getConversations } from '@/modules/live-chat/actions/conversation-actions'
import { getAgents } from '@/modules/live-chat/actions/agent-actions'
import { LiveChatOverviewWrapper } from '@/modules/live-chat/components/wrappers/LiveChatOverviewWrapper'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function OverviewContent({ siteId }: { siteId: string }) {
  const [statsResult, conversationsResult, agentsResult] = await Promise.all([
    getConversationStats(siteId),
    getConversations(siteId, { status: 'active' }, 1, 5),
    getAgents(siteId),
  ])

  const stats = statsResult.stats
  const conversations = conversationsResult.conversations
  const agents = agentsResult.agents

  return (
    <LiveChatOverviewWrapper
      stats={stats}
      recentConversations={conversations}
      agents={agents}
      siteId={siteId}
    />
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  )
}

export default async function LiveChatOverviewPage({ params }: PageProps) {
  const { siteId } = await params

  // Layout handles auth and module access check

  return (
    <div className="container py-6">
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
