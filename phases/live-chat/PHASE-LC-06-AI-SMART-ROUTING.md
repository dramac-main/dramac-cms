# PHASE LC-06: AI Auto-Responder & Smart Conversation Routing

**Phase**: LC-06  
**Module**: Live Chat & Omnichannel Messaging  
**Goal**: Build Claude-powered AI auto-responder that handles conversations when agents are offline/busy, intelligent conversation routing based on department rules and content analysis, and AI-assisted agent tools (response suggestions, conversation summaries, sentiment analysis)  
**Independence**: Requires LC-01 (types + DB) and LC-02 (actions)  
**Estimated Files**: ~8 files  
**Prerequisites**: LC-01, LC-02 complete. ANTHROPIC_API_KEY env var required

---

## CRITICAL RULES

1. Read `/memory-bank/systemPatterns.md` for ALL platform patterns before starting
2. Use Anthropic Claude via AI SDK — follow pattern from `src/modules/social-media/lib/ai-content-service.ts`
3. Import AI model from `@/config/ai-provider` using `getAIModel('chat')` or similar
4. AI responses must be clearly marked as AI-generated (is_ai_generated = true, ai_confidence score)
5. AI should use knowledge base articles as context when available
6. AI should hand off to human agent when it can't answer or visitor requests human
7. ZERO mock data — all AI calls are real API calls
8. Graceful degradation: if AI fails or ANTHROPIC_API_KEY not set, skip AI and route to agents
9. Run `npx tsc --noEmit` at the end — zero errors

---

## Task 1: AI Responder Service

**File**: `next-platform-dashboard/src/modules/live-chat/lib/ai-responder.ts`

```typescript
// AI-powered auto-responder service using Claude
// Server-side only

// Import:
// - generateText from 'ai'
// - getAIModel from '@/config/ai-provider' (or create anthropic model directly)
// - createAdminClient from @/lib/supabase/admin

// Configuration
// const AI_ENABLED = !!process.env.ANTHROPIC_API_KEY
// const MAX_CONTEXT_MESSAGES = 10  // How many previous messages to include as context
// const HANDOFF_KEYWORDS = ['human', 'agent', 'person', 'speak to someone', 'real person', 'talk to agent']
// const CONFIDENCE_THRESHOLD = 0.7  // Below this, suggest human handoff

// 1. generateAutoResponse(conversationId: string, visitorMessage: string, siteId: string)
//    - If !AI_ENABLED, return null (graceful skip)
//    - Load context:
//      a. Widget settings (company name, welcome message)
//      b. Knowledge base articles for the site (active ones)
//      c. Previous messages in conversation (last MAX_CONTEXT_MESSAGES)
//      d. Visitor info (name, email, previous conversations count)
//    - Check for handoff keywords in visitorMessage → if found, return handoff response
//    - Build system prompt:
//      """
//      You are a customer support AI assistant for {companyName}.
//      You help website visitors with their questions.
//      
//      RULES:
//      - Be helpful, friendly, and professional
//      - Keep responses concise (2-3 sentences max)
//      - If you don't know the answer, say so and offer to connect with a human agent
//      - Never make up information
//      - If the visitor asks to speak to a human, immediately offer to connect them
//      - Use the knowledge base articles below to answer questions when relevant
//      - Respond in the same language as the visitor
//      
//      KNOWLEDGE BASE:
//      {formatted knowledge base articles}
//      
//      CONVERSATION HISTORY:
//      {previous messages}
//      
//      VISITOR INFO:
//      Name: {name}, Email: {email}
//      """
//    - Call generateText with the prompt and visitor message
//    - Parse response, estimate confidence score (based on whether KB article matched)
//    - Return { response: string, confidence: number, shouldHandoff: boolean, matchedArticleId?: string }

// 2. shouldAutoRespond(siteId: string, conversationId: string): boolean
//    - Check if any agent is online for this site
//    - If no agents online → auto-respond
//    - If all agents busy (current_chat_count >= max) → auto-respond
//    - If conversation already has agent assigned → don't auto-respond
//    - Return true/false

// 3. suggestResponse(conversationId: string, visitorMessage: string, siteId: string)
//    - Similar to generateAutoResponse but returns suggestions for the agent
//    - Returns 3 suggested responses with confidence scores
//    - Used in the agent dashboard as "AI Suggestions"
//    - Return { suggestions: Array<{ text: string, confidence: number }>, error: string | null }

// 4. summarizeConversation(conversationId: string)
//    - Load all messages in conversation
//    - Use Claude to generate a brief summary
//    - Include: main topic, visitor sentiment, key issues, resolution status
//    - Return { summary: string, sentiment: 'positive' | 'neutral' | 'negative', topics: string[], error: string | null }

// 5. detectIntent(message: string)
//    - Analyze a visitor's message to determine intent
//    - Return categories like: 'question', 'complaint', 'feedback', 'booking_request', 'pricing_inquiry', 'technical_support', 'general'
//    - Used for routing to correct department
//    - Return { intent: string, confidence: number, suggestedDepartment?: string }

// 6. analyzeSentiment(message: string)
//    - Quick sentiment analysis without full AI call
//    - Use keyword-based analysis (fast) + optional AI analysis (accurate)
//    - Return { sentiment: 'positive' | 'neutral' | 'negative', score: number }
```

---

## Task 2: Routing Engine

**File**: `next-platform-dashboard/src/modules/live-chat/lib/routing-engine.ts`

```typescript
// Conversation routing logic
// Server-side only

// 1. routeConversation(siteId: string, conversationId: string, options?: { departmentId?: string, intent?: string })
//    - Determine which agent/department should handle this conversation
//    - Routing priority:
//      a. If departmentId specified (visitor chose in pre-chat form) → route to that department
//      b. If intent detected → match intent to department (via department description/tags)
//      c. Default department for the site
//    - Within department, find available agent:
//      a. Status = 'online'
//      b. current_chat_count < max_concurrent_chats
//      c. Least loaded first (lowest current_chat_count)
//    - If no available agent:
//      a. Set conversation status to 'waiting'
//      b. Trigger AI auto-responder if enabled
//    - If agent found:
//      a. Assign conversation to agent
//      b. Set status to 'active'
//      c. Update agent's current_chat_count
//      d. Send notification to agent
//    - Return { agentId: string | null, departmentId: string | null, isQueued: boolean, error: string | null }

// 2. rebalanceConversations(siteId: string)
//    - Called when agent comes online or goes offline
//    - Find unassigned/waiting conversations
//    - Try to assign to newly available agents
//    - Return { assigned: number, error: string | null }

// 3. checkMissedConversations(siteId: string, thresholdMinutes: number = 5)
//    - Find conversations with status 'pending' older than threshold
//    - Mark as 'missed'
//    - Send notification to site owner
//    - Return { missed: number, error: string | null }

// 4. getQueuePosition(conversationId: string)
//    - Count conversations with status 'waiting' or 'pending' created before this one
//    - Return { position: number, estimatedWaitMinutes: number, error: string | null }
```

---

## Task 3: AI Auto-Response Integration

Integrate the AI responder into the message flow. When a new visitor message comes in:

**File**: `next-platform-dashboard/src/modules/live-chat/lib/auto-response-handler.ts`

```typescript
// Auto-response orchestration
// Called after a visitor message is stored

// handleNewVisitorMessage(conversationId: string, siteId: string, visitorMessage: string)
//   1. Check shouldAutoRespond(siteId, conversationId)
//   2. If yes:
//      a. Generate AI response via generateAutoResponse()
//      b. If response and confidence >= CONFIDENCE_THRESHOLD:
//         - Insert message with sender_type 'ai', is_ai_generated true, ai_confidence score
//         - If response suggests handoff, insert system message "Connecting you with an agent..."
//         - Route conversation to agent queue
//      c. If confidence < threshold:
//         - Don't send AI response
//         - Route to agent queue
//         - Insert system message "An agent will be with you shortly"
//   3. If no (agents available):
//      - Route conversation via routeConversation()
//      - If no agent available, trigger AI response as fallback
//   4. Always: detect intent for routing (async, non-blocking)
```

---

## Task 4: AI Agent Assistant Components

Components that help agents in the dashboard:

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/AiSuggestions.tsx`

```
'use client' component — Shows AI-suggested responses in the conversation view

Props: { conversationId: string, latestVisitorMessage: string, siteId: string, onUseSuggestion: (text: string) => void }

Display:
1. "AI Suggestions" header with sparkles icon
2. List of 2-3 suggested responses
3. Each suggestion: text preview + "Use" button
4. Click "Use" → populates the message input
5. "Regenerate" button to get new suggestions
6. Loading state while generating
7. Error state if AI unavailable
8. Collapsed by default, expand on new visitor message
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/ConversationSummary.tsx`

```
'use client' component — AI-generated conversation summary in visitor info panel

Props: { conversationId: string }

Display:
1. "Summary" section header with AI icon
2. Brief text summary of the conversation
3. Sentiment indicator (positive/neutral/negative)
4. Topic tags
5. "Refresh" button
6. Loading skeleton while generating
7. Only shows after 3+ messages in conversation
```

---

## Task 5: AI Actions (Server Actions)

**File**: `next-platform-dashboard/src/modules/live-chat/actions/ai-actions.ts`

```typescript
'use server'

// 1. getAiSuggestions(conversationId: string, latestMessage: string, siteId: string)
//    - Call suggestResponse from ai-responder
//    - Return { suggestions: Array<{ text: string, confidence: number }>, error: string | null }

// 2. getConversationSummary(conversationId: string)
//    - Call summarizeConversation from ai-responder
//    - Return { summary: string, sentiment: string, topics: string[], error: string | null }

// 3. detectMessageIntent(message: string)
//    - Call detectIntent from ai-responder
//    - Return { intent: string, confidence: number, suggestedDepartment?: string, error: string | null }

// 4. getAiStatus()
//    - Check if ANTHROPIC_API_KEY is set
//    - Return { enabled: boolean }
```

---

## Task 6: Cron Route for Missed Conversations

**File**: `next-platform-dashboard/src/app/api/cron/chat/route.ts`

```typescript
// Cron job that runs every 5 minutes to:
// 1. Check for missed conversations (pending > 5 minutes with no agent response)
// 2. Mark them as 'missed'
// 3. Send notifications to site owners
// 4. Try to rebalance conversations if agents are now available
// 5. Aggregate daily analytics (update mod_chat_analytics)
//
// Security: Check CRON_SECRET header
// Pattern: Follow src/app/api/cron/domains/route.ts
//
// Also handles:
// - Closing stale conversations (no messages in 24 hours → auto-close)
// - Updating agent status (if agent hasn't been active in 30 minutes → set offline)
```

---

## Task 7: Update Automation Integration

If the automation module exists, register chat events as automation triggers:

**File**: Check if `src/modules/automation/lib/action-types.ts` exists and add chat triggers:

```
New trigger types:
- chat.conversation.created → When a new chat starts
- chat.message.received → When a visitor sends a message
- chat.conversation.resolved → When a conversation is resolved
- chat.conversation.missed → When a conversation is missed

New action types:
- chat.message.send → Send a chat message
- chat.conversation.assign → Assign to agent
- chat.conversation.add_tag → Add tag to conversation
```

The implementing AI should check if the automation module integration is feasible and add the triggers/actions if the pattern supports it. If not straightforward, create a TODO comment for future integration.

---

## Verification Checklist

1. [ ] AI auto-responder generates responses using Claude
2. [ ] Knowledge base articles are used as context for AI responses
3. [ ] AI responses are marked with is_ai_generated = true and confidence score
4. [ ] Handoff detection works (visitor asks for human → system connects to agent)
5. [ ] Routing engine correctly assigns conversations to least-loaded agents
6. [ ] Routing respects department assignments
7. [ ] AI suggestions appear in agent dashboard
8. [ ] Conversation summary generates correctly
9. [ ] Sentiment analysis works
10. [ ] Intent detection helps route to correct department
11. [ ] Cron job marks missed conversations correctly
12. [ ] Stale conversations auto-close after 24h
13. [ ] Agent presence auto-updates to offline after inactivity
14. [ ] Graceful degradation when ANTHROPIC_API_KEY not set
15. [ ] `npx tsc --noEmit` passes with zero errors

### Testing Instructions
1. Ensure ANTHROPIC_API_KEY is set in .env.local
2. Create knowledge base articles about your test business
3. Start a chat with no agents online → AI should respond
4. Ask a question that matches a knowledge base article → AI should use it
5. Ask to "speak to a human" → AI should offer handoff
6. Bring an agent online → verify new conversations route to them
7. Check AI suggestions in agent dashboard → verify they appear
8. Open conversation with 5+ messages → check summary generation
9. Leave a conversation pending for 5+ minutes → run cron → verify it's marked missed
10. Commit: `git add -A && git commit -m "feat(live-chat): PHASE-LC-06: AI auto-responder & smart conversation routing" && git push`
