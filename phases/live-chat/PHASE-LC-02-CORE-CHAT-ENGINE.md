# PHASE LC-02: Core Chat Engine — Real-Time Messaging & Server Actions

**Phase**: LC-02  
**Module**: Live Chat & Omnichannel Messaging  
**Goal**: Build the complete server-side chat engine — all server actions for conversations, messages, agents, departments, canned responses, knowledge base, widget settings, and the Supabase Realtime hooks for real-time messaging  
**Independence**: Requires LC-01 (database + types)  
**Estimated Files**: ~18 files  
**Prerequisites**: LC-01 must be complete (tables + types exist)

---

## CRITICAL RULES

1. Read `/memory-bank/systemPatterns.md` for ALL platform patterns before starting
2. Every server action file starts with `'use server'`
3. Use `createClient` from `@/lib/supabase/server` for server actions
4. Use `mapRecord()`/`mapRecords()` from `../lib/map-db-record` on ALL Supabase data returns
5. Use `(supabase as any).from('mod_chat_...')` since mod_chat tables aren't in generated types
6. Return `{ data, error }` or `{ success, error }` pattern from every action
7. Every server page: `if (!user) redirect('/login')`
8. ZERO mock data — all data comes from database
9. `revalidatePath()` after mutations
10. Run `npx tsc --noEmit` at the end — must be zero errors

---

## Task 1: Conversation Actions

**File**: `next-platform-dashboard/src/modules/live-chat/actions/conversation-actions.ts`

Implement these server actions:

```typescript
'use server'

// All functions use createClient from @/lib/supabase/server
// All functions use mapRecord/mapRecords from ../lib/map-db-record
// All functions import types from ../types

// 1. getConversations(siteId, filters?: ConversationFilters, page?: number, pageSize?: number)
//    - Query mod_chat_conversations with joins to mod_chat_visitors (name, email, avatar),
//      mod_chat_agents (display_name), mod_chat_departments (name)
//    - Apply filters: status, channel, assignedAgentId, departmentId, priority, search, dateFrom, dateTo
//    - Search filters on visitor name, email, last_message_text
//    - Sort by last_message_at DESC (most recent first)
//    - Paginated with offset/limit
//    - Return { conversations: ConversationListItem[], total: number, error: string | null }

// 2. getConversation(conversationId: string)
//    - Single conversation with full visitor, agent, department joins
//    - Return { conversation: ChatConversation | null, error: string | null }

// 3. createConversation(data: { siteId, visitorId, channel, departmentId?, subject? })
//    - Insert into mod_chat_conversations
//    - Auto-assign to available agent if department has auto_assign enabled
//    - Return { conversation: ChatConversation | null, error: string | null }

// 4. assignConversation(conversationId: string, agentId: string)
//    - Update assigned_agent_id
//    - Update status to 'active' if was 'pending'
//    - Increment agent's current_chat_count
//    - Record wait_time_seconds (now - created_at)
//    - revalidatePath
//    - Return { success: boolean, error: string | null }

// 5. transferConversation(conversationId: string, toAgentId: string, note?: string)
//    - Decrement old agent's current_chat_count
//    - Update assigned_agent_id to new agent
//    - Increment new agent's current_chat_count
//    - Insert system message "Conversation transferred to [agent name]"
//    - If note provided, insert internal note message
//    - Return { success: boolean, error: string | null }

// 6. resolveConversation(conversationId: string)
//    - Update status to 'resolved', set resolved_at to now()
//    - Calculate resolution_time_seconds
//    - Decrement agent's current_chat_count
//    - Increment agent's total_chats_handled
//    - Insert system message "Conversation resolved"
//    - Return { success: boolean, error: string | null }

// 7. closeConversation(conversationId: string)
//    - Update status to 'closed', set closed_at to now()
//    - If was active, also set resolved_at
//    - Decrement agent's current_chat_count if agent assigned
//    - Return { success: boolean, error: string | null }

// 8. reopenConversation(conversationId: string)
//    - Update status to 'active' (if was resolved/closed)
//    - Clear resolved_at, closed_at
//    - Return { success: boolean, error: string | null }

// 9. updateConversationPriority(conversationId: string, priority: ConversationPriority)
//    - Update priority field
//    - Return { success: boolean, error: string | null }

// 10. updateConversationTags(conversationId: string, tags: string[])
//     - Update tags array
//     - Return { success: boolean, error: string | null }

// 11. updateInternalNotes(conversationId: string, notes: string)
//     - Update internal_notes field
//     - Return { success: boolean, error: string | null }

// 12. markConversationRead(conversationId: string, role: 'agent' | 'visitor')
//     - Set unread_agent_count or unread_visitor_count to 0
//     - Also mark all messages as 'read' for the respective sender_type
//     - Return { success: boolean, error: string | null }

// 13. getConversationStats(siteId: string)
//     - Query counts: active, pending, waiting, resolved (today), missed (today)
//     - Query online agents count
//     - Query avg response time from today's resolved conversations
//     - Query today's satisfaction average
//     - Return { stats: ChatOverviewStats, error: string | null }
```

---

## Task 2: Message Actions

**File**: `next-platform-dashboard/src/modules/live-chat/actions/message-actions.ts`

```typescript
'use server'

// 1. getMessages(conversationId: string, page?: number, pageSize?: number)
//    - Query mod_chat_messages ordered by created_at ASC
//    - Paginated (older messages first, load more = earlier pages)
//    - Return { messages: ChatMessage[], total: number, error: string | null }

// 2. sendMessage(data: { conversationId, siteId, senderType, senderId?, senderName?, content, contentType?, isInternalNote? })
//    - Insert into mod_chat_messages
//    - If contentType is 'note', set is_internal_note = true
//    - If first agent message in conversation, calculate and set first_response_time_seconds on conversation
//    - If conversation was 'pending', update to 'active'
//    - Return { message: ChatMessage | null, error: string | null }

// 3. sendFileMessage(data: { conversationId, siteId, senderType, senderId?, senderName?, fileUrl, fileName, fileSize, fileMimeType, contentType })
//    - Insert message with file attachment fields
//    - Return { message: ChatMessage | null, error: string | null }

// 4. updateMessageStatus(messageId: string, status: MessageStatus)
//    - Update status field
//    - Return { success: boolean, error: string | null }

// 5. deleteMessage(messageId: string)
//    - Soft delete: update content to '[Message deleted]', clear file fields
//    - Return { success: boolean, error: string | null }
```

---

## Task 3: Agent Actions

**File**: `next-platform-dashboard/src/modules/live-chat/actions/agent-actions.ts`

```typescript
'use server'

// 1. getAgents(siteId: string)
//    - Query mod_chat_agents with department join
//    - Order by display_name ASC
//    - Return { agents: ChatAgent[], error: string | null }

// 2. getAgent(agentId: string)
//    - Single agent with department join
//    - Return { agent: ChatAgent | null, error: string | null }

// 3. createAgent(data: { siteId, userId, displayName, email?, role?, departmentId?, maxConcurrentChats? })
//    - Insert into mod_chat_agents
//    - Check UNIQUE(site_id, user_id) — if exists, return error
//    - Return { agent: ChatAgent | null, error: string | null }

// 4. updateAgent(agentId: string, data: Partial<{ displayName, email, role, departmentId, maxConcurrentChats, isActive }>)
//    - Update fields
//    - Return { success: boolean, error: string | null }

// 5. updateAgentStatus(agentId: string, status: AgentStatus)
//    - Update status and last_active_at
//    - Return { success: boolean, error: string | null }

// 6. deleteAgent(agentId: string)
//    - Soft delete: set is_active = false
//    - Reassign any active conversations to unassigned
//    - Return { success: boolean, error: string | null }

// 7. getAgentPerformance(siteId: string, dateFrom?: string, dateTo?: string)
//    - Query agents with their conversation stats from mod_chat_conversations
//    - Calculate: total chats, resolved, avg response time, avg rating, current load
//    - Return { performance: AgentPerformanceData[], error: string | null }

// 8. getOnlineAgents(siteId: string)
//    - Query agents where status IN ('online', 'away', 'busy')
//    - Return { agents: ChatAgent[], error: string | null }

// 9. getAvailableAgent(siteId: string, departmentId?: string)
//    - Find agent with status = 'online', current_chat_count < max_concurrent_chats
//    - If departmentId provided, filter by department
//    - Order by current_chat_count ASC (least loaded first)
//    - Return { agent: ChatAgent | null, error: string | null }
```

---

## Task 4: Department Actions

**File**: `next-platform-dashboard/src/modules/live-chat/actions/department-actions.ts`

```typescript
'use server'

// 1. getDepartments(siteId: string)
//    - Query mod_chat_departments ordered by sort_order
//    - Include count of agents per department
//    - Return { departments: (ChatDepartment & { agentCount: number })[], error: string | null }

// 2. createDepartment(data: { siteId, name, description?, autoAssign?, maxConcurrentChats? })
//    - If first department, set is_default = true
//    - Return { department: ChatDepartment | null, error: string | null }

// 3. updateDepartment(departmentId: string, data: Partial<{ name, description, isActive, autoAssign, maxConcurrentChats, sortOrder }>)
//    - Update fields
//    - Return { success: boolean, error: string | null }

// 4. deleteDepartment(departmentId: string)
//    - Cannot delete if is_default
//    - Move agents to default department before deleting
//    - Return { success: boolean, error: string | null }

// 5. setDefaultDepartment(siteId: string, departmentId: string)
//    - Unset current default, set new default
//    - Return { success: boolean, error: string | null }
```

---

## Task 5: Canned Response Actions

**File**: `next-platform-dashboard/src/modules/live-chat/actions/canned-response-actions.ts`

```typescript
'use server'

// 1. getCannedResponses(siteId: string, category?: string)
//    - Query mod_chat_canned_responses where is_active = true
//    - Filter by category if provided
//    - Order by usage_count DESC
//    - Return { responses: CannedResponse[], error: string | null }

// 2. createCannedResponse(data: { siteId, title, content, shortcut?, category?, tags?, isShared?, createdBy? })
//    - Insert into mod_chat_canned_responses
//    - Return { response: CannedResponse | null, error: string | null }

// 3. updateCannedResponse(responseId: string, data: Partial<{ title, content, shortcut, category, tags, isShared, isActive }>)
//    - Return { success: boolean, error: string | null }

// 4. deleteCannedResponse(responseId: string)
//    - Hard delete
//    - Return { success: boolean, error: string | null }

// 5. incrementCannedResponseUsage(responseId: string)
//    - Increment usage_count, update last_used_at
//    - Return { success: boolean, error: string | null }

// 6. searchCannedResponses(siteId: string, query: string)
//    - Search title, content, shortcut fields with ILIKE
//    - Return { responses: CannedResponse[], error: string | null }
```

---

## Task 6: Widget Settings Actions

**File**: `next-platform-dashboard/src/modules/live-chat/actions/widget-actions.ts`

```typescript
'use server'

// 1. getWidgetSettings(siteId: string)
//    - Query mod_chat_widget_settings by site_id
//    - If none exists, create default settings and return
//    - Return { settings: ChatWidgetSettings | null, error: string | null }

// 2. updateWidgetSettings(siteId: string, data: Partial<ChatWidgetSettings>)
//    - Upsert into mod_chat_widget_settings
//    - Return { success: boolean, error: string | null }

// 3. getPublicWidgetSettings(siteId: string)
//    - Same as getWidgetSettings but only return public-facing fields
//    - (appearance, branding, pre-chat form, business hours, language)
//    - Used by the embedded widget (no auth required)
//    - Return { settings: Partial<ChatWidgetSettings> | null, error: string | null }

// 4. isWithinBusinessHours(siteId: string)
//    - Check widget settings for business_hours_enabled
//    - If not enabled, return true (always open)
//    - If enabled, check current time against business_hours JSON using timezone
//    - Import DEFAULT_TIMEZONE from @/lib/locale-config as fallback
//    - Return { isOpen: boolean, nextOpenAt: string | null, error: string | null }
```

---

## Task 7: Visitor Actions

**File**: `next-platform-dashboard/src/modules/live-chat/actions/visitor-actions.ts`

```typescript
'use server'

// 1. getVisitors(siteId: string, page?: number, pageSize?: number)
//    - Paginated list of visitors ordered by last_seen_at DESC
//    - Return { visitors: ChatVisitor[], total: number, error: string | null }

// 2. getVisitor(visitorId: string)
//    - Single visitor
//    - Return { visitor: ChatVisitor | null, error: string | null }

// 3. createOrUpdateVisitor(data: { siteId, name?, email?, phone?, channel, browser?, os?, device?, ipAddress?, country?, city?, currentPageUrl?, currentPageTitle?, referrerUrl?, landingPageUrl?, whatsappPhone?, externalId? })
//    - If visitor with same email or whatsappPhone exists for site, update last_seen_at and increment total_visits
//    - Otherwise create new visitor
//    - Return { visitor: ChatVisitor | null, error: string | null }

// 4. updateVisitorInfo(visitorId: string, data: Partial<{ name, email, phone, tags, notes, customData }>)
//    - Return { success: boolean, error: string | null }

// 5. updateVisitorPageTracking(visitorId: string, data: { currentPageUrl, currentPageTitle })
//    - Update page tracking fields and last_seen_at
//    - Return { success: boolean, error: string | null }

// 6. linkVisitorToCrm(visitorId: string, crmContactId: string)
//    - Set crm_contact_id field
//    - Return { success: boolean, error: string | null }

// 7. getVisitorConversations(visitorId: string)
//    - Query mod_chat_conversations for this visitor, ordered by created_at DESC
//    - Return { conversations: ChatConversation[], error: string | null }
```

---

## Task 8: Knowledge Base Actions

**File**: `next-platform-dashboard/src/modules/live-chat/actions/knowledge-base-actions.ts`

```typescript
'use server'

// 1. getKnowledgeBaseArticles(siteId: string, category?: string)
//    - Query mod_chat_knowledge_base where is_active = true
//    - Filter by category if provided
//    - Order by usage_count DESC
//    - Return { articles: KnowledgeBaseArticle[], error: string | null }

// 2. createArticle(data: { siteId, title, content, category?, tags?, createdBy? })
//    - Return { article: KnowledgeBaseArticle | null, error: string | null }

// 3. updateArticle(articleId: string, data: Partial<{ title, content, category, tags, isActive }>)
//    - Return { success: boolean, error: string | null }

// 4. deleteArticle(articleId: string)
//    - Hard delete
//    - Return { success: boolean, error: string | null }

// 5. searchKnowledgeBase(siteId: string, query: string)
//    - Search title and content with ILIKE
//    - Return { articles: KnowledgeBaseArticle[], error: string | null }
```

---

## Task 9: Actions Barrel Export

**File**: `next-platform-dashboard/src/modules/live-chat/actions/index.ts`

```typescript
export * from './conversation-actions'
export * from './message-actions'
export * from './agent-actions'
export * from './department-actions'
export * from './canned-response-actions'
export * from './widget-actions'
export * from './visitor-actions'
export * from './knowledge-base-actions'
```

---

## Task 10: Realtime Chat Hook

**File**: `next-platform-dashboard/src/modules/live-chat/hooks/use-chat-realtime.ts`

```typescript
'use client'

// This hook subscribes to Supabase Realtime for live message updates in a conversation.
// Follow the pattern from src/lib/studio/hooks/use-module-sync.ts

// import { createClient } from '@/lib/supabase/client'
// import { RealtimeChannel } from '@supabase/supabase-js'
// import { useEffect, useRef, useCallback } from 'react'
// import { ChatMessage } from '../types'
// import { mapRecord } from '../lib/map-db-record'

// useChatRealtime(conversationId: string, callbacks: {
//   onNewMessage: (message: ChatMessage) => void
//   onMessageUpdate?: (message: ChatMessage) => void
//   onTypingStart?: (senderId: string, senderName: string) => void
//   onTypingStop?: (senderId: string) => void
// })
//
// Implementation:
// 1. Create supabase client
// 2. Subscribe to channel `chat:${conversationId}`
// 3. Listen for postgres_changes on mod_chat_messages WHERE conversation_id = conversationId
//    - On INSERT: mapRecord<ChatMessage>(payload.new) → call onNewMessage
//    - On UPDATE: mapRecord<ChatMessage>(payload.new) → call onMessageUpdate
// 4. Listen for broadcast events for typing indicators
//    - 'typing_start' → call onTypingStart
//    - 'typing_stop' → call onTypingStop
// 5. Return: { sendTypingStart, sendTypingStop, channel }
// 6. Cleanup: channel.unsubscribe() on unmount
//
// Export: sendTypingIndicator(channel, type: 'start' | 'stop', senderId, senderName)
//   - channel.send({ type: 'broadcast', event: `typing_${type}`, payload: { senderId, senderName } })
```

---

## Task 11: Agent Presence Hook

**File**: `next-platform-dashboard/src/modules/live-chat/hooks/use-agent-presence.ts`

```typescript
'use client'

// This hook uses Supabase Realtime Presence to track agent online/offline status.
// This is new to the platform — no existing presence pattern exists.

// import { createClient } from '@/lib/supabase/client'
// import { RealtimeChannel } from '@supabase/supabase-js'
// import { useState, useEffect, useRef, useCallback } from 'react'
// import { PresenceState, AgentStatus } from '../types'

// useAgentPresence(siteId: string, agentId: string, initialStatus: AgentStatus)
//
// Implementation:
// 1. Create supabase client
// 2. Create channel `presence:chat:${siteId}`
// 3. Track presence with: channel.track({ agentId, status: initialStatus, currentChats: 0, lastSeen: new Date().toISOString() })
// 4. Listen for presence sync events to get all online agents
// 5. State: onlineAgents: PresenceState[]
// 6. Provide: updateStatus(newStatus) → re-track with new status
// 7. Cleanup: channel.untrack() + channel.unsubscribe()
//
// Return: { onlineAgents, updateStatus }
```

---

## Task 12: Conversation List Realtime Hook

**File**: `next-platform-dashboard/src/modules/live-chat/hooks/use-conversations-realtime.ts`

```typescript
'use client'

// This hook subscribes to conversation-level updates for the agent dashboard.
// Listens for new conversations, status changes, and assignment changes.

// useConversationsRealtime(siteId: string, callbacks: {
//   onNewConversation: (conv: ChatConversation) => void
//   onConversationUpdate: (conv: ChatConversation) => void
//   onConversationDeleted?: (convId: string) => void
// })
//
// Implementation:
// 1. Subscribe to channel `conversations:${siteId}`
// 2. Listen for postgres_changes on mod_chat_conversations WHERE site_id = siteId
//    - INSERT → onNewConversation
//    - UPDATE → onConversationUpdate
//    - DELETE → onConversationDeleted
// 3. Cleanup on unmount
//
// Return: { channel }
```

---

## Task 13: Hooks Barrel Export

**File**: `next-platform-dashboard/src/modules/live-chat/hooks/index.ts`

```typescript
export { useChatRealtime } from './use-chat-realtime'
export { useAgentPresence } from './use-agent-presence'
export { useConversationsRealtime } from './use-conversations-realtime'
```

---

## Task 14: Update Module Index

**File**: Update `next-platform-dashboard/src/modules/live-chat/index.ts`

Add the new exports:

```typescript
// Types
export * from './types'

// Manifest
export { default as liveChatManifest } from './manifest'

// DB Mapping
export { mapRecord, mapRecords } from './lib/map-db-record'

// Actions
export * from './actions'

// Hooks
export * from './hooks'
```

---

## Verification Checklist

1. [ ] All 8 action files compile with zero TypeScript errors
2. [ ] All 3 hooks compile with zero TypeScript errors
3. [ ] Every action uses `createClient` from `@/lib/supabase/server`
4. [ ] Every action uses `mapRecord()`/`mapRecords()` on Supabase data
5. [ ] Every action uses `(supabase as any).from('mod_chat_...')` pattern
6. [ ] Every action returns `{ data, error }` or `{ success, error }`
7. [ ] Every mutation calls `revalidatePath()`
8. [ ] Realtime hooks use browser client from `@/lib/supabase/client`
9. [ ] Realtime hooks properly cleanup on unmount
10. [ ] Typing indicator uses broadcast (not postgres_changes)
11. [ ] Presence hook uses Supabase Presence API
12. [ ] Zero mock data anywhere
13. [ ] `npx tsc --noEmit` passes with zero errors

### Testing Instructions
1. Import any action file and verify no type errors
2. Import hooks and verify no type errors
3. Test conversation CRUD: create → assign → send message → resolve → close
4. Test realtime: open two browser tabs, send message in one, verify it appears in other
5. Test presence: verify agent shows as online when hook mounts
6. Commit: `git add -A && git commit -m "feat(live-chat): PHASE-LC-02: core chat engine — server actions & realtime hooks" && git push`
