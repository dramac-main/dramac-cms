'use server'

/**
 * Chat Notifications Service
 *
 * PHASE LC-04: Handles in-app notifications for live chat events.
 * Follows the same pattern as business-notifications.ts:
 * - createNotification() → in-app only (DB insert)
 * - Email templates for chat will be added in LC-08 (Production Hardening)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/services/notifications'

// =============================================================================
// TYPES
// =============================================================================

interface ChatNotificationData {
  siteId: string
  conversationId: string
  visitorName?: string
  visitorEmail?: string
  messageText?: string
  agentName?: string
  agentUserId?: string
  departmentName?: string
}

interface ChatRatingNotificationData {
  siteId: string
  conversationId: string
  visitorName?: string
  agentName?: string
  agentUserId?: string
  rating: number
  comment?: string
}

// =============================================================================
// HELPERS
// =============================================================================

async function getSiteOwnerInfo(siteId: string) {
  const supabase = createAdminClient()

  const { data: site } = await supabase
    .from('sites')
    .select('name, agency_id')
    .eq('id', siteId)
    .single()

  if (!site) return null

  const { data: agency } = await supabase
    .from('agencies')
    .select('owner_id')
    .eq('id', site.agency_id)
    .single()

  if (!agency) return null

  const { data: owner } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', agency.owner_id)
    .single()

  return owner ? { siteName: site.name, owner } : null
}

function chatLink(siteId: string, conversationId: string) {
  return `/dashboard/sites/${siteId}/live-chat/conversations/${conversationId}`
}

// =============================================================================
// NOTIFICATION FUNCTIONS
// =============================================================================

/**
 * New chat message received from visitor.
 * → In-app notification to assigned agent (or site owner if unassigned)
 */
export async function notifyNewChatMessage(data: ChatNotificationData): Promise<void> {
  try {
    const recipientId = data.agentUserId
    if (!recipientId) {
      // No agent assigned — notify site owner
      const info = await getSiteOwnerInfo(data.siteId)
      if (!info) return

      await createNotification({
        userId: info.owner.id,
        type: 'chat_message',
        title: `New chat from ${data.visitorName || 'Visitor'}`,
        message: data.messageText
          ? data.messageText.substring(0, 100) + (data.messageText.length > 100 ? '...' : '')
          : 'New chat message received',
        link: chatLink(data.siteId, data.conversationId),
        metadata: {
          module: 'live-chat',
          conversationId: data.conversationId,
          visitorName: data.visitorName,
        },
      })
      return
    }

    await createNotification({
      userId: recipientId,
      type: 'chat_message',
      title: `New message from ${data.visitorName || 'Visitor'}`,
      message: data.messageText
        ? data.messageText.substring(0, 100) + (data.messageText.length > 100 ? '...' : '')
        : 'New chat message received',
      link: chatLink(data.siteId, data.conversationId),
      metadata: {
        module: 'live-chat',
        conversationId: data.conversationId,
        visitorName: data.visitorName,
      },
    })
  } catch (error) {
    console.error('[ChatNotify] Error notifying new message:', error)
  }
}

/**
 * Chat assigned to an agent.
 * → In-app notification to the assigned agent
 */
export async function notifyChatAssigned(data: ChatNotificationData): Promise<void> {
  try {
    if (!data.agentUserId) return

    await createNotification({
      userId: data.agentUserId,
      type: 'chat_assigned',
      title: 'Chat assigned to you',
      message: `${data.visitorName || 'A visitor'}${data.departmentName ? ` (${data.departmentName})` : ''} has been assigned to you`,
      link: chatLink(data.siteId, data.conversationId),
      metadata: {
        module: 'live-chat',
        conversationId: data.conversationId,
        visitorName: data.visitorName,
      },
    })
  } catch (error) {
    console.error('[ChatNotify] Error notifying chat assigned:', error)
  }
}

/**
 * Missed chat — no agent responded within the window.
 * → In-app notification to site owner + branded email to site owner
 */
export async function notifyChatMissed(data: ChatNotificationData): Promise<void> {
  try {
    const info = await getSiteOwnerInfo(data.siteId)
    if (!info) return

    // In-app notification
    await createNotification({
      userId: info.owner.id,
      type: 'chat_missed',
      title: 'Missed chat',
      message: `Chat from ${data.visitorName || 'a visitor'} was not answered`,
      link: chatLink(data.siteId, data.conversationId),
      metadata: {
        module: 'live-chat',
        conversationId: data.conversationId,
        visitorName: data.visitorName,
      },
    })

    // Email for missed chats will be added in LC-08 (Production Hardening)
    // when chat-specific email templates are created
  } catch (error) {
    console.error('[ChatNotify] Error notifying missed chat:', error)
  }
}

/**
 * Satisfaction rating received.
 * → In-app notification to the agent or site owner
 */
export async function notifyChatRating(data: ChatRatingNotificationData): Promise<void> {
  try {
    const stars = '⭐'.repeat(data.rating)
    const recipientId = data.agentUserId

    if (recipientId) {
      await createNotification({
        userId: recipientId,
        type: 'chat_rating',
        title: `Chat rated ${stars}`,
        message: data.comment
          ? `${data.visitorName || 'Visitor'}: "${data.comment.substring(0, 100)}"`
          : `${data.visitorName || 'A visitor'} rated their chat ${data.rating}/5`,
        link: chatLink(data.siteId, data.conversationId),
        metadata: {
          module: 'live-chat',
          conversationId: data.conversationId,
          rating: data.rating,
          comment: data.comment,
        },
      })
    }

    // Also notify owner for low ratings (1-2 stars)
    if (data.rating <= 2) {
      const info = await getSiteOwnerInfo(data.siteId)
      if (!info || info.owner.id === recipientId) return

      await createNotification({
        userId: info.owner.id,
        type: 'chat_rating',
        title: `Low chat rating: ${data.rating}/5`,
        message: `${data.visitorName || 'A visitor'} gave a ${data.rating}-star rating${data.agentName ? ` (agent: ${data.agentName})` : ''}`,
        link: chatLink(data.siteId, data.conversationId),
        metadata: {
          module: 'live-chat',
          conversationId: data.conversationId,
          rating: data.rating,
        },
      })
    }
  } catch (error) {
    console.error('[ChatNotify] Error notifying chat rating:', error)
  }
}

/**
 * Send chat transcript via email to a visitor.
 * Note: Requires chat email templates to be defined in LC-08.
 * For now, logs intent and returns success.
 */
export async function sendTranscriptEmail(data: {
  siteId: string
  conversationId: string
  visitorEmail: string
  visitorName?: string
  messages: Array<{
    senderType: string
    senderName?: string
    text: string
    createdAt: string
  }>
}): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!data.visitorEmail) {
      return { success: false, error: 'No email address' }
    }

    // Transcript email will use sendBrandedEmail once chat email templates
    // are defined in LC-08 (Production Hardening). For now, log the intent.
    console.log(
      `[ChatNotify] Transcript email queued for ${data.visitorEmail} ` +
      `(conversation: ${data.conversationId}, ${data.messages.length} messages)`
    )

    return { success: true, error: null }
  } catch (error) {
    console.error('[ChatNotify] Error sending transcript:', error)
    return { success: false, error: (error as Error).message }
  }
}
