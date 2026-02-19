/**
 * AI Auto-Responder Service
 *
 * PHASE LC-06: Claude-powered AI responses using knowledge base context.
 * Server-side only.
 */

import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createAdminClient } from '@/lib/supabase/admin'

// =============================================================================
// CONFIG
// =============================================================================

const AI_ENABLED = !!process.env.ANTHROPIC_API_KEY
const MAX_CONTEXT_MESSAGES = 10
const HANDOFF_KEYWORDS = [
  'human', 'agent', 'person', 'speak to someone', 'real person',
  'talk to agent', 'live agent', 'support agent', 'customer service',
  'representative', 'operator',
]
const CONFIDENCE_THRESHOLD = 0.7

function getModel() {
  return anthropic('claude-sonnet-4-6')
}

// =============================================================================
// AUTO-RESPONSE
// =============================================================================

export async function generateAutoResponse(
  conversationId: string,
  visitorMessage: string,
  siteId: string
): Promise<{
  response: string
  confidence: number
  shouldHandoff: boolean
  matchedArticleId?: string
} | null> {
  if (!AI_ENABLED) return null

  try {
    const supabase = createAdminClient() as any

    // Check for handoff keywords
    const lowerMsg = visitorMessage.toLowerCase()
    if (HANDOFF_KEYWORDS.some((kw) => lowerMsg.includes(kw))) {
      return {
        response:
          "I understand you'd like to speak with a human agent. Let me connect you right away. An agent will be with you shortly!",
        confidence: 1.0,
        shouldHandoff: true,
      }
    }

    // Load context
    const [settingsRes, kbRes, messagesRes, visitorRes] = await Promise.all([
      supabase
        .from('mod_chat_widget_settings')
        .select('company_name, welcome_message')
        .eq('site_id', siteId)
        .single(),
      supabase
        .from('mod_chat_knowledge_base')
        .select('id, title, content, category, tags')
        .eq('site_id', siteId)
        .eq('is_active', true)
        .limit(20),
      supabase
        .from('mod_chat_messages')
        .select('sender_type, sender_name, content, content_type')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(MAX_CONTEXT_MESSAGES),
      supabase
        .from('mod_chat_conversations')
        .select('mod_chat_visitors(name, email, total_conversations)')
        .eq('id', conversationId)
        .single(),
    ])

    const companyName =
      settingsRes.data?.company_name || 'our company'
    const kbArticles = kbRes.data || []
    const previousMessages = (messagesRes.data || []).reverse()
    const visitorInfo = visitorRes.data?.mod_chat_visitors

    // Format knowledge base
    const kbText =
      kbArticles.length > 0
        ? kbArticles
            .map(
              (a: Record<string, unknown>) =>
                `## ${a.title}\n${a.content}\nCategory: ${a.category || 'General'}`
            )
            .join('\n\n')
        : 'No knowledge base articles available.'

    // Format conversation history
    const historyText = previousMessages
      .map(
        (m: Record<string, unknown>) =>
          `${m.sender_type === 'visitor' ? 'Visitor' : m.sender_name || 'Agent'}: ${m.content}`
      )
      .join('\n')

    const systemPrompt = `You are a customer support AI assistant for ${companyName}.
You help website visitors with their questions.

RULES:
- Be helpful, friendly, and professional
- Keep responses concise (2-3 sentences max)
- If you don't know the answer, say so and offer to connect with a human agent
- Never make up information
- If the visitor asks to speak to a human, immediately offer to connect them
- Use the knowledge base articles below to answer questions when relevant
- Respond in the same language as the visitor

KNOWLEDGE BASE:
${kbText}

CONVERSATION HISTORY:
${historyText}

VISITOR INFO:
Name: ${visitorInfo?.name || 'Unknown'}
Email: ${visitorInfo?.email || 'Not provided'}
Previous conversations: ${visitorInfo?.total_conversations || 0}`

    const result = await generateText({
      model: getModel(),
      system: systemPrompt,
      prompt: visitorMessage,
    })

    // Estimate confidence based on knowledge base match
    const responseText = result.text
    let confidence = 0.6 // Base confidence
    let matchedArticleId: string | undefined

    for (const article of kbArticles) {
      const titleLower = ((article as Record<string, unknown>).title as string).toLowerCase()
      const contentLower = ((article as Record<string, unknown>).content as string).toLowerCase()
      if (
        lowerMsg.includes(titleLower) ||
        titleLower.includes(lowerMsg) ||
        contentLower.includes(lowerMsg)
      ) {
        confidence = 0.85
        matchedArticleId = (article as Record<string, unknown>).id as string
        break
      }
    }

    // If response suggests lack of knowledge, lower confidence
    if (
      responseText.toLowerCase().includes("i don't know") ||
      responseText.toLowerCase().includes('not sure') ||
      responseText.toLowerCase().includes("can't find")
    ) {
      confidence = 0.4
    }

    return {
      response: responseText,
      confidence,
      shouldHandoff: confidence < CONFIDENCE_THRESHOLD,
      matchedArticleId,
    }
  } catch (err) {
    console.error('[AI Responder] Error:', err)
    return null
  }
}

// =============================================================================
// SHOULD AUTO-RESPOND
// =============================================================================

export async function shouldAutoRespond(
  siteId: string,
  conversationId: string
): Promise<boolean> {
  if (!AI_ENABLED) return false

  try {
    const supabase = createAdminClient() as any

    // Check if conversation already has an agent
    const { data: conv } = await supabase
      .from('mod_chat_conversations')
      .select('assigned_agent_id')
      .eq('id', conversationId)
      .single()

    if (conv?.assigned_agent_id) return false

    // Check if any agents are online and available
    const { data: agents } = await supabase
      .from('mod_chat_agents')
      .select('id, status, current_chat_count, max_concurrent_chats')
      .eq('site_id', siteId)
      .eq('status', 'online')
      .eq('is_active', true)

    if (!agents || agents.length === 0) return true

    // Check if all agents are at capacity
    const available = agents.filter(
      (a: Record<string, unknown>) =>
        (a.current_chat_count as number) < (a.max_concurrent_chats as number)
    )

    return available.length === 0
  } catch {
    return false
  }
}

// =============================================================================
// SUGGEST RESPONSES
// =============================================================================

export async function suggestResponse(
  conversationId: string,
  visitorMessage: string,
  siteId: string
): Promise<{
  suggestions: Array<{ text: string; confidence: number }>
  error: string | null
}> {
  if (!AI_ENABLED) {
    return { suggestions: [], error: 'AI not configured' }
  }

  try {
    const supabase = createAdminClient() as any

    const { data: kbArticles } = await supabase
      .from('mod_chat_knowledge_base')
      .select('title, content')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .limit(10)

    const kbText =
      (kbArticles || [])
        .map(
          (a: Record<string, unknown>) => `${a.title}: ${a.content}`
        )
        .join('\n\n') || 'No knowledge base articles.'

    const result = await generateText({
      model: getModel(),
      system: `You are an assistant helping customer support agents craft replies.
Based on the visitor's message and the knowledge base, suggest 3 different response options.
Each should be 1-3 sentences, professional, and helpful.
Format: Return exactly 3 responses separated by "---".

KNOWLEDGE BASE:
${kbText}`,
      prompt: `Visitor message: "${visitorMessage}"\n\nSuggest 3 different agent responses:`,
    })

    const parts = result.text
      .split('---')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3)

    const suggestions = parts.map((text, i) => ({
      text,
      confidence: 0.8 - i * 0.1,
    }))

    return { suggestions, error: null }
  } catch (err) {
    return {
      suggestions: [],
      error: err instanceof Error ? err.message : 'AI suggestion failed',
    }
  }
}

// =============================================================================
// SUMMARIZE CONVERSATION
// =============================================================================

export async function summarizeConversation(
  conversationId: string
): Promise<{
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  topics: string[]
  error: string | null
}> {
  if (!AI_ENABLED) {
    return {
      summary: '',
      sentiment: 'neutral',
      topics: [],
      error: 'AI not configured',
    }
  }

  try {
    const supabase = createAdminClient() as any

    const { data: messages } = await supabase
      .from('mod_chat_messages')
      .select('sender_type, sender_name, content, content_type')
      .eq('conversation_id', conversationId)
      .eq('content_type', 'text')
      .order('created_at', { ascending: true })
      .limit(50)

    if (!messages || messages.length < 2) {
      return {
        summary: 'Too few messages to summarize.',
        sentiment: 'neutral',
        topics: [],
        error: null,
      }
    }

    const transcript = messages
      .map(
        (m: Record<string, unknown>) =>
          `${m.sender_type === 'visitor' ? 'Visitor' : m.sender_name || 'Agent'}: ${m.content}`
      )
      .join('\n')

    const result = await generateText({
      model: getModel(),
      system: `Summarize the support conversation below. Return EXACTLY this format:
SUMMARY: [1-2 sentence summary]
SENTIMENT: [positive|neutral|negative]
TOPICS: [comma-separated list of 2-4 topics]`,
      prompt: transcript,
    })

    const text = result.text
    const summaryMatch = text.match(/SUMMARY:\s*(.+)/i)
    const sentimentMatch = text.match(/SENTIMENT:\s*(positive|neutral|negative)/i)
    const topicsMatch = text.match(/TOPICS:\s*(.+)/i)

    return {
      summary: summaryMatch?.[1]?.trim() || text,
      sentiment: (sentimentMatch?.[1]?.toLowerCase() as 'positive' | 'neutral' | 'negative') || 'neutral',
      topics: topicsMatch?.[1]
        ?.split(',')
        .map((t) => t.trim())
        .filter(Boolean) || [],
      error: null,
    }
  } catch (err) {
    return {
      summary: '',
      sentiment: 'neutral',
      topics: [],
      error: err instanceof Error ? err.message : 'Summarization failed',
    }
  }
}

// =============================================================================
// INTENT DETECTION
// =============================================================================

export async function detectIntent(
  message: string
): Promise<{
  intent: string
  confidence: number
  suggestedDepartment?: string
}> {
  // Fast keyword-based detection (no API call)
  const lowerMsg = message.toLowerCase()

  const intentMap: Array<{
    keywords: string[]
    intent: string
    department?: string
    confidence: number
  }> = [
    {
      keywords: ['price', 'pricing', 'cost', 'how much', 'quote', 'fee', 'rate'],
      intent: 'pricing_inquiry',
      department: 'Sales',
      confidence: 0.85,
    },
    {
      keywords: ['book', 'appointment', 'schedule', 'reservation', 'availability'],
      intent: 'booking_request',
      department: 'Sales',
      confidence: 0.85,
    },
    {
      keywords: ['broken', 'not working', 'error', 'bug', 'issue', 'problem', 'help'],
      intent: 'technical_support',
      department: 'Support',
      confidence: 0.8,
    },
    {
      keywords: ['complaint', 'unhappy', 'disappointed', 'terrible', 'worst', 'refund'],
      intent: 'complaint',
      department: 'Support',
      confidence: 0.85,
    },
    {
      keywords: ['thank', 'great', 'awesome', 'love', 'amazing', 'excellent', 'feedback'],
      intent: 'feedback',
      confidence: 0.75,
    },
    {
      keywords: ['question', 'what is', 'how do', 'can you', 'where', 'when'],
      intent: 'question',
      confidence: 0.7,
    },
  ]

  for (const mapping of intentMap) {
    if (mapping.keywords.some((kw) => lowerMsg.includes(kw))) {
      return {
        intent: mapping.intent,
        confidence: mapping.confidence,
        suggestedDepartment: mapping.department,
      }
    }
  }

  return { intent: 'general', confidence: 0.5 }
}

// =============================================================================
// SENTIMENT ANALYSIS
// =============================================================================

export function analyzeSentiment(
  message: string
): { sentiment: 'positive' | 'neutral' | 'negative'; score: number } {
  const lowerMsg = message.toLowerCase()

  const positiveWords = [
    'thank', 'thanks', 'great', 'awesome', 'excellent', 'love', 'happy',
    'perfect', 'wonderful', 'amazing', 'good', 'helpful', 'appreciate',
  ]
  const negativeWords = [
    'bad', 'terrible', 'horrible', 'worst', 'hate', 'angry', 'disappointed',
    'frustrated', 'annoying', 'useless', 'stupid', 'broken', 'complaint',
  ]

  let score = 0
  for (const word of positiveWords) {
    if (lowerMsg.includes(word)) score += 1
  }
  for (const word of negativeWords) {
    if (lowerMsg.includes(word)) score -= 1
  }

  if (score > 0) return { sentiment: 'positive', score: Math.min(score / 3, 1) }
  if (score < 0) return { sentiment: 'negative', score: Math.max(score / 3, -1) }
  return { sentiment: 'neutral', score: 0 }
}
