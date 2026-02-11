/**
 * Chat Widget Page
 *
 * PHASE LC-04: Standalone page that renders inside an iframe on customer sites
 * URL: /embed/chat-widget?siteId=xxx
 *
 * Fetches widget settings server-side, then renders the client ChatWidget component
 */

import { ChatWidget } from '@/modules/live-chat/components/widget/ChatWidget'

interface PageProps {
  searchParams: Promise<{ siteId?: string }>
}

export default async function ChatWidgetPage({ searchParams }: PageProps) {
  const { siteId } = await searchParams

  if (!siteId) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-muted-foreground">
        Widget configuration error: missing siteId
      </div>
    )
  }

  return <ChatWidget siteId={siteId} />
}
