'use client'

/**
 * WhatsAppPageWrapper — WhatsApp conversations or setup prompt
 */

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Phone, Settings, ExternalLink } from 'lucide-react'
import type {
  ConversationListItem,
  ChatWidgetSettings,
} from '@/modules/live-chat/types'
import { ConversationsPageWrapper } from './ConversationsPageWrapper'
import type { ChatAgent, ChatDepartment } from '@/modules/live-chat/types'

interface WhatsAppPageWrapperProps {
  isConfigured: boolean
  conversations: ConversationListItem[]
  total: number
  agents: ChatAgent[]
  departments: ChatDepartment[]
  siteId: string
}

export function WhatsAppPageWrapper({
  isConfigured,
  conversations,
  total,
  agents,
  departments,
  siteId,
}: WhatsAppPageWrapperProps) {
  const router = useRouter()

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">WhatsApp</h2>
          <p className="text-muted-foreground">
            Connect WhatsApp Business to receive and respond to customer messages
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              Connect WhatsApp Business
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To receive WhatsApp messages in your live chat, you need to
              configure the WhatsApp Business API integration in Settings.
            </p>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Requirements:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  A WhatsApp Business Account
                </li>
                <li className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Meta Cloud API access (v21.0)
                </li>
                <li className="flex items-center gap-2">
                  <Settings className="h-4 w-4 shrink-0" />
                  Access Token and Phone Number ID
                </li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() =>
                  router.push(
                    `/dashboard/sites/${siteId}/live-chat/settings`
                  )
                }
              >
                <Settings className="h-4 w-4 mr-2" />
                Go to Settings
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    'https://developers.facebook.com/docs/whatsapp/cloud-api',
                    '_blank'
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                WhatsApp API Docs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-emerald-600" />
          WhatsApp Conversations
        </h2>
        <p className="text-muted-foreground">
          Manage all WhatsApp customer conversations
        </p>
      </div>

      <ConversationsPageWrapper
        initialConversations={conversations}
        total={total}
        agents={agents}
        departments={departments}
        siteId={siteId}
      />
    </div>
  )
}
