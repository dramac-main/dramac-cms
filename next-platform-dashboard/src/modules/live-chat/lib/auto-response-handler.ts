/**
 * Auto-Response Handler
 *
 * PHASE LC-06: Orchestrates the AI auto-response flow when a new
 * visitor message arrives and no agent is available.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import {
  generateAutoResponse,
  shouldAutoRespond,
  analyzeSentiment,
} from './ai-responder'
import { routeConversation } from './routing-engine'

// =============================================================================
// HANDLE NEW VISITOR MESSAGE
// =============================================================================

export async function handleNewVisitorMessage(
  siteId: string,
  conversationId: string,
  visitorMessage: string,
  visitorId: string
): Promise<{
  handled: boolean
  aiResponded: boolean
  routedToAgent: boolean
  agentId?: string
}> {
  const supabase = createAdminClient() as any

  // 1. Try to route to an available agent first
  const routingResult = await routeConversation(
    siteId,
    conversationId,
    visitorMessage
  )

  if (routingResult.agentId) {
    return {
      handled: true,
      aiResponded: false,
      routedToAgent: true,
      agentId: routingResult.agentId,
    }
  }

  // 2. No agent available — check if we should auto-respond
  const canAutoRespond = await shouldAutoRespond(siteId, conversationId)

  if (!canAutoRespond) {
    return {
      handled: false,
      aiResponded: false,
      routedToAgent: false,
    }
  }

  // 3. Generate AI response
  const aiResult = await generateAutoResponse(
    conversationId,
    visitorMessage,
    siteId
  )

  if (!aiResult) {
    return { handled: false, aiResponded: false, routedToAgent: false }
  }

  // 4. Save AI response as a message
  await supabase.from('mod_chat_messages').insert({
    conversation_id: conversationId,
    sender_type: 'system',
    sender_name: 'AI Assistant',
    content: aiResult.response,
    content_type: 'text',
    metadata: {
      ai_generated: true,
      confidence: aiResult.confidence,
      matched_article_id: aiResult.matchedArticleId,
    },
  })

  // 5. Analyze sentiment
  const sentiment = analyzeSentiment(visitorMessage)

  // 6. Update conversation metadata
  await supabase
    .from('mod_chat_conversations')
    .update({
      metadata: {
        ai_responded: true,
        ai_confidence: aiResult.confidence,
        last_sentiment: sentiment.sentiment,
        queue_position: routingResult.queuePosition,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  // 7. If AI confidence is low or handoff requested, queue for agent
  if (aiResult.shouldHandoff) {
    await supabase
      .from('mod_chat_conversations')
      .update({ status: 'waiting' })
      .eq('id', conversationId)
  }

  return {
    handled: true,
    aiResponded: true,
    routedToAgent: false,
  }
}
