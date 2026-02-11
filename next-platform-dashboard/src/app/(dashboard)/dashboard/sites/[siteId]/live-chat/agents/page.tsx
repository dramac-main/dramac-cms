/**
 * Agents Management Page
 *
 * PHASE LC-03: Agent CRUD, department management, performance metrics
 */

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getAgents, getAgentPerformance } from '@/modules/live-chat/actions/agent-actions'
import { getDepartments } from '@/modules/live-chat/actions/department-actions'
import { AgentsPageWrapper } from '@/modules/live-chat/components/wrappers/AgentsPageWrapper'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function AgentsContent({ siteId }: { siteId: string }) {
  const [agentsResult, departmentsResult, performanceResult] =
    await Promise.all([
      getAgents(siteId),
      getDepartments(siteId),
      getAgentPerformance(siteId),
    ])

  return (
    <AgentsPageWrapper
      agents={agentsResult.agents}
      departments={departmentsResult.departments}
      performance={performanceResult.performance}
      siteId={siteId}
    />
  )
}

function AgentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40 rounded-lg" />
    </div>
  )
}

export default async function AgentsPage({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <Suspense fallback={<AgentsSkeleton />}>
        <AgentsContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
