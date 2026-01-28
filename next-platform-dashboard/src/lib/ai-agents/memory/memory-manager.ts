/**
 * Memory Manager
 * 
 * Phase EM-58A: AI Agents - Core Infrastructure
 * 
 * Manages agent memory: short-term conversations, long-term facts,
 * episodic memories, and semantic search.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { getEmbeddingsService } from '../llm/embeddings'
import type { 
  Memory, 
  MemoryType,
  Conversation,
  Message,
  Episode,
  ActionRecord
} from '../types'

// ============================================================================
// TYPE HELPERS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentDB = any

// ============================================================================
// MEMORY OPERATIONS
// ============================================================================

/**
 * Store a new memory
 */
export async function storeMemory(
  agentId: string,
  siteId: string,
  memory: {
    memoryType: MemoryType
    content: string
    subjectType?: string
    subjectId?: string
    confidence?: number
    importance?: number
    source?: string
    tags?: string[]
    expiresAt?: string
  }
): Promise<Memory> {
  const supabase = await createClient() as AgentDB
  const embeddings = getEmbeddingsService()
  
  // Generate embedding for semantic search
  const embedding = await embeddings.embed(memory.content)
  
  const { data, error } = await supabase
    .from('ai_agent_memories')
    .insert({
      agent_id: agentId,
      site_id: siteId,
      memory_type: memory.memoryType,
      content: memory.content,
      embedding,
      confidence: memory.confidence ?? 0.8,
      importance: memory.importance ?? 5,
      subject_type: memory.subjectType,
      subject_id: memory.subjectId,
      source: memory.source,
      tags: memory.tags || [],
      expires_at: memory.expiresAt
    })
    .select()
    .single()

  if (error) throw error
  return mapMemory(data)
}

/**
 * Retrieve relevant memories using semantic search
 */
export async function retrieveRelevantMemories(
  agentId: string,
  query: string,
  options: {
    limit?: number
    types?: MemoryType[]
    subjectType?: string
    subjectId?: string
    minConfidence?: number
  } = {}
): Promise<Memory[]> {
  const supabase = await createClient() as AgentDB
  const embeddings = getEmbeddingsService()
  
  // Generate query embedding
  const queryEmbedding = await embeddings.embed(query)
  
  // Use the database function for vector similarity search
  const { data, error } = await supabase.rpc('search_agent_memories', {
    p_agent_id: agentId,
    p_query_embedding: queryEmbedding,
    p_limit: options.limit || 10,
    p_memory_types: options.types || null
  })

  if (error) {
    console.error('[Memory] Search failed:', error)
    return []
  }
  
  // Update access timestamps for retrieved memories
  if (data?.length) {
    const memoryIds = data.map((m: { id: string }) => m.id)
    await supabase
      .from('ai_agent_memories')
      .update({ 
        last_accessed_at: new Date().toISOString(),
        access_count: supabase.sql`access_count + 1`
      })
      .in('id', memoryIds)
  }

  return data?.map(mapMemory) || []
}

/**
 * Get memories by subject
 */
export async function getMemoriesBySubject(
  agentId: string,
  subjectType: string,
  subjectId: string,
  options: {
    limit?: number
    types?: MemoryType[]
  } = {}
): Promise<Memory[]> {
  const supabase = await createClient() as AgentDB
  
  let query = supabase
    .from('ai_agent_memories')
    .select('*')
    .eq('agent_id', agentId)
    .eq('subject_type', subjectType)
    .eq('subject_id', subjectId)
    .order('importance', { ascending: false })
  
  if (options.types?.length) {
    query = query.in('memory_type', options.types)
  }
  
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data?.map(mapMemory) || []
}

/**
 * Update memory confidence
 */
export async function updateMemoryConfidence(
  memoryId: string,
  newConfidence: number
): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  await supabase
    .from('ai_agent_memories')
    .update({
      confidence: newConfidence,
      updated_at: new Date().toISOString()
    })
    .eq('id', memoryId)
}

/**
 * Delete a memory
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const supabase = await createClient() as AgentDB
  
  await supabase
    .from('ai_agent_memories')
    .delete()
    .eq('id', memoryId)
}

/**
 * Find similar memory (for deduplication)
 */
export async function findSimilarMemory(
  agentId: string,
  content: string,
  threshold: number = 0.95
): Promise<{ id: string; similarity: number } | null> {
  const supabase = await createClient() as AgentDB
  const embeddings = getEmbeddingsService()
  
  const queryEmbedding = await embeddings.embed(content)
  
  const { data } = await supabase.rpc('search_agent_memories', {
    p_agent_id: agentId,
    p_query_embedding: queryEmbedding,
    p_limit: 1,
    p_memory_types: null
  })
  
  if (data?.length && data[0].similarity >= threshold) {
    return {
      id: data[0].id,
      similarity: data[0].similarity
    }
  }
  
  return null
}

// ============================================================================
// CONVERSATION OPERATIONS
// ============================================================================

/**
 * Create a new conversation
 */
export async function createConversation(
  agentId: string,
  siteId: string,
  options: {
    contextType: 'entity' | 'user' | 'session'
    contextId?: string
    metadata?: Record<string, unknown>
    expiresAt?: string
  }
): Promise<Conversation> {
  const supabase = await createClient() as AgentDB
  
  const { data, error } = await supabase
    .from('ai_agent_conversations')
    .insert({
      agent_id: agentId,
      site_id: siteId,
      context_type: options.contextType,
      context_id: options.contextId,
      messages: [],
      metadata: options.metadata || {},
      expires_at: options.expiresAt
    })
    .select()
    .single()

  if (error) throw error
  return mapConversation(data)
}

/**
 * Get conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const supabase = await createClient() as AgentDB
  
  const { data, error } = await supabase
    .from('ai_agent_conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (error || !data) return null
  return mapConversation(data)
}

/**
 * Add message to conversation
 */
export async function addMessageToConversation(
  conversationId: string,
  message: Omit<Message, 'id' | 'createdAt'>
): Promise<Conversation> {
  const supabase = await createClient() as AgentDB
  
  // Get current conversation
  const { data: conv } = await supabase
    .from('ai_agent_conversations')
    .select('messages, tokens_used')
    .eq('id', conversationId)
    .single()
  
  if (!conv) throw new Error('Conversation not found')
  
  const messages = [...(conv.messages || []), {
    id: crypto.randomUUID(),
    ...message,
    createdAt: new Date().toISOString()
  }]
  
  // Estimate token count (rough approximation)
  const estimatedTokens = Math.ceil(message.content.length / 4)
  
  const { data, error } = await supabase
    .from('ai_agent_conversations')
    .update({
      messages,
      message_count: messages.length,
      tokens_used: (conv.tokens_used || 0) + estimatedTokens,
      last_message_at: new Date().toISOString()
    })
    .eq('id', conversationId)
    .select()
    .single()

  if (error) throw error
  return mapConversation(data)
}

/**
 * Get or create conversation for context
 */
export async function getOrCreateConversation(
  agentId: string,
  siteId: string,
  contextType: 'entity' | 'user' | 'session',
  contextId?: string
): Promise<Conversation> {
  const supabase = await createClient() as AgentDB
  
  // Try to find existing conversation
  let query = supabase
    .from('ai_agent_conversations')
    .select('*')
    .eq('agent_id', agentId)
    .eq('site_id', siteId)
    .eq('context_type', contextType)
  
  if (contextId) {
    query = query.eq('context_id', contextId)
  }
  
  query = query.gt('expires_at', new Date().toISOString())
    .order('last_message_at', { ascending: false })
    .limit(1)
  
  const { data } = await query
  
  if (data?.length) {
    return mapConversation(data[0])
  }
  
  // Create new conversation
  return createConversation(agentId, siteId, {
    contextType,
    contextId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  })
}

// ============================================================================
// EPISODE OPERATIONS
// ============================================================================

/**
 * Record an episode (completed agent run)
 */
export async function recordEpisode(
  agentId: string,
  siteId: string,
  episode: {
    executionId?: string
    triggerEvent?: string
    contextSummary?: string
    actionsTaken: ActionRecord[]
    outcome: 'success' | 'partial' | 'failure'
    outcomeDetails?: string
    lessonsLearned?: string[]
    shouldRepeat?: boolean
    durationMs?: number
    tokensUsed?: number
  }
): Promise<Episode> {
  const supabase = await createClient() as AgentDB
  
  const { data, error } = await supabase
    .from('ai_agent_episodes')
    .insert({
      agent_id: agentId,
      site_id: siteId,
      execution_id: episode.executionId,
      trigger_event: episode.triggerEvent,
      context_summary: episode.contextSummary,
      actions_taken: episode.actionsTaken,
      outcome: episode.outcome,
      outcome_details: episode.outcomeDetails,
      lessons_learned: episode.lessonsLearned || [],
      should_repeat: episode.shouldRepeat,
      duration_ms: episode.durationMs,
      tokens_used: episode.tokensUsed
    })
    .select()
    .single()

  if (error) throw error
  return mapEpisode(data)
}

/**
 * Get similar past episodes
 */
export async function getSimilarEpisodes(
  agentId: string,
  triggerEvent: string,
  limit: number = 5
): Promise<Episode[]> {
  const supabase = await createClient() as AgentDB
  
  const { data, error } = await supabase
    .from('ai_agent_episodes')
    .select('*')
    .eq('agent_id', agentId)
    .eq('trigger_event', triggerEvent)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data?.map(mapEpisode) || []
}

/**
 * Get successful episodes for learning
 */
export async function getSuccessfulEpisodes(
  agentId: string,
  limit: number = 10
): Promise<Episode[]> {
  const supabase = await createClient() as AgentDB
  
  const { data, error } = await supabase
    .from('ai_agent_episodes')
    .select('*')
    .eq('agent_id', agentId)
    .eq('outcome', 'success')
    .eq('should_repeat', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data?.map(mapEpisode) || []
}

// ============================================================================
// MEMORY CONSOLIDATION
// ============================================================================

/**
 * Consolidate and prune memories periodically
 */
export async function consolidateMemories(agentId: string): Promise<{
  merged: number
  pruned: number
}> {
  const supabase = await createClient() as AgentDB
  
  // Get all memories for agent
  const { data: memories } = await supabase
    .from('ai_agent_memories')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: true })

  if (!memories || memories.length < 100) {
    return { merged: 0, pruned: 0 }
  }

  const merged = 0
  let pruned = 0

  // Prune low-importance, old, rarely accessed memories
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  
  const { count } = await supabase
    .from('ai_agent_memories')
    .delete()
    .eq('agent_id', agentId)
    .lt('importance', 3)
    .lt('access_count', 2)
    .lt('created_at', thirtyDaysAgo)

  pruned = count || 0

  // Remove expired memories
  const { count: expiredCount } = await supabase
    .from('ai_agent_memories')
    .delete()
    .eq('agent_id', agentId)
    .lt('expires_at', new Date().toISOString())

  pruned += expiredCount || 0

  return { merged, pruned }
}

// ============================================================================
// MAPPERS
// ============================================================================

function mapMemory(data: Record<string, unknown>): Memory {
  return {
    id: data.id as string,
    agentId: data.agent_id as string,
    siteId: data.site_id as string,
    memoryType: data.memory_type as MemoryType,
    subjectType: data.subject_type as string | undefined,
    subjectId: data.subject_id as string | undefined,
    content: data.content as string,
    embedding: data.embedding as number[] | undefined,
    confidence: Number(data.confidence) || 0.8,
    source: data.source as string | undefined,
    tags: (data.tags as string[]) || [],
    importance: Number(data.importance) || 5,
    accessCount: Number(data.access_count) || 0,
    lastAccessedAt: data.last_accessed_at as string | undefined,
    expiresAt: data.expires_at as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string
  }
}

function mapConversation(data: Record<string, unknown>): Conversation {
  return {
    id: data.id as string,
    agentId: data.agent_id as string,
    siteId: data.site_id as string,
    contextType: data.context_type as 'entity' | 'user' | 'session',
    contextId: data.context_id as string | undefined,
    messages: (data.messages as Message[]) || [],
    metadata: (data.metadata as Record<string, unknown>) || {},
    startedAt: data.started_at as string,
    lastMessageAt: data.last_message_at as string,
    expiresAt: data.expires_at as string | undefined,
    messageCount: Number(data.message_count) || 0,
    tokensUsed: Number(data.tokens_used) || 0
  }
}

function mapEpisode(data: Record<string, unknown>): Episode {
  return {
    id: data.id as string,
    agentId: data.agent_id as string,
    siteId: data.site_id as string,
    executionId: data.execution_id as string | undefined,
    triggerEvent: data.trigger_event as string | undefined,
    contextSummary: data.context_summary as string | undefined,
    actionsTaken: (data.actions_taken as ActionRecord[]) || [],
    outcome: data.outcome as 'success' | 'partial' | 'failure',
    outcomeDetails: data.outcome_details as string | undefined,
    lessonsLearned: (data.lessons_learned as string[]) || [],
    shouldRepeat: data.should_repeat as boolean | undefined,
    durationMs: data.duration_ms as number | undefined,
    tokensUsed: data.tokens_used as number | undefined,
    createdAt: data.created_at as string
  }
}
