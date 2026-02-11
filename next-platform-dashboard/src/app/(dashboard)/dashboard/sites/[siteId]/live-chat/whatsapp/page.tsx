/**
 * WhatsApp Conversations Page
 *
 * PHASE LC-03: WhatsApp-specific conversation list or setup prompt
 */

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getConversations } from '@/modules/live-chat/actions/conversation-actions'
import { getAgents } from '@/modules/live-chat/actions/agent-actions'
import { getDepartments } from '@/modules/live-chat/actions/department-actions'
import { getWidgetSettings } from '@/modules/live-chat/actions/widget-actions'
import { WhatsAppPageWrapper } from '@/modules/live-chat/components/wrappers/WhatsAppPageWrapper'

interface PageProps {
  params: Promise<{ siteId: string }>
}

async function WhatsAppContent({ siteId }: { siteId: string }) {
  const [settingsResult, conversationsResult, agentsResult, departmentsResult] =
    await Promise.all([
      getWidgetSettings(siteId),
      getConversations(siteId, { channel: 'whatsapp' }, 1, 20),
      getAgents(siteId),
      getDepartments(siteId),
    ])

  const settings = settingsResult.settings
  const isConfigured = !!(
    settings?.whatsappPhoneNumberId && settings?.whatsappBusinessAccountId
  )

  return (
    <WhatsAppPageWrapper
      isConfigured={isConfigured}
      conversations={conversationsResult.conversations}
      total={conversationsResult.total}
      agents={agentsResult.agents}
      departments={departmentsResult.departments}
      siteId={siteId}
    />
  )
}

function WhatsAppSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-64 max-w-2xl rounded-lg" />
    </div>
  )
}

export default async function WhatsAppPage({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <Suspense fallback={<WhatsAppSkeleton />}>
        <WhatsAppContent siteId={siteId} />
      </Suspense>
    </div>
  )
}
