/**
 * AI Server Actions
 *
 * PHASE LC-06: Server actions for AI-powered chat features.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { suggestResponse, summarizeConversation, detectIntent, analyzeSentiment } from '../lib/ai-responder'
import { routeConversation, getQueuePosition } from '../lib/routing-engine'

// =============================================================================
// GET AI SUGGESTIONS
// =============================================================================

export async function getAiSuggestions(
  conversationId: string,
  visitorMessage: string,
  siteId: string
): Promise<{
  success: boolean
  suggestions: Array<{ text: string; confidence: number }>
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, suggestions: [], error: 'Not authenticated' }

    const result = await suggestResponse(conversationId, visitorMessage, siteId)

    return {
      success: !result.error,
      suggestions: result.suggestions,
      error: result.error || undefined,
    }
  } catch (err) {
    return {
      success: false,
      suggestions: [],
      error: err instanceof Error ? err.message : 'Failed to get suggestions',
    }
  }
}

// =============================================================================
// GET CONVERSATION SUMMARY
// =============================================================================

export async function getConversationSummary(
  conversationId: string
): Promise<{
  success: boolean
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  topics: string[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        summary: '',
        sentiment: 'neutral',
        topics: [],
        error: 'Not authenticated',
      }
    }

    const result = await summarizeConversation(conversationId)

    return {
      success: !result.error,
      summary: result.summary,
      sentiment: result.sentiment,
      topics: result.topics,
      error: result.error || undefined,
    }
  } catch (err) {
    return {
      success: false,
      summary: '',
      sentiment: 'neutral',
      topics: [],
      error: err instanceof Error ? err.message : 'Failed to summarize',
    }
  }
}

// =============================================================================
// DETECT MESSAGE INTENT
// =============================================================================

export async function detectMessageIntent(
  message: string
): Promise<{
  success: boolean
  intent: string
  confidence: number
  suggestedDepartment?: string
}> {
  try {
    const result = await detectIntent(message)
    return { success: true, ...result }
  } catch {
    return { success: false, intent: 'unknown', confidence: 0 }
  }
}

// =============================================================================
// GET AI STATUS
// =============================================================================

export async function getAiStatus(): Promise<{
  enabled: boolean
  model: string
  features: string[]
}> {
  const enabled = !!process.env.ANTHROPIC_API_KEY

  return {
    enabled,
    model: enabled ? 'claude-sonnet-4-6' : 'none',
    features: enabled
      ? [
          'Auto-responses when no agents available',
          'AI-suggested replies for agents',
          'Conversation summarization',
          'Intent detection & smart routing',
          'Sentiment analysis',
        ]
      : [],
  }
}

// =============================================================================
// ROUTE CONVERSATION TO BEST AGENT
// =============================================================================

export async function routeToAgent(
  siteId: string,
  conversationId: string,
  message?: string,
  departmentId?: string
): Promise<{
  success: boolean
  agentId: string | null
  reason: string
  queuePosition?: number
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, agentId: null, reason: 'Not authenticated' }
    }

    const result = await routeConversation(siteId, conversationId, message, departmentId)

    return {
      success: !!result.agentId,
      agentId: result.agentId,
      reason: result.reason,
      queuePosition: result.queuePosition,
    }
  } catch (err) {
    return {
      success: false,
      agentId: null,
      reason: err instanceof Error ? err.message : 'Routing failed',
    }
  }
}

// =============================================================================
// GET QUEUE POSITION
// =============================================================================

export async function getConversationQueuePosition(
  siteId: string
): Promise<{ position: number }> {
  const position = await getQueuePosition(siteId)
  return { position }
}

// =============================================================================
// ANALYZE MESSAGE SENTIMENT
// =============================================================================

export async function analyzeMessageSentiment(
  message: string
): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number
}> {
  return analyzeSentiment(message)
}
