/**
 * Analytics Page
 *
 * PHASE LC-07: Full analytics dashboard with charts and export.
 */

import { ChatAnalyticsWrapper } from '@/modules/live-chat/components/wrappers/ChatAnalyticsWrapper'

interface PageProps {
  params: Promise<{ siteId: string }>
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { siteId } = await params

  return (
    <div className="container py-6">
      <ChatAnalyticsWrapper siteId={siteId} />
    </div>
  )
}
