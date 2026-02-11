# PHASE LC-03: Agent Dashboard — Full Conversation Management UI

**Phase**: LC-03  
**Module**: Live Chat & Omnichannel Messaging  
**Goal**: Build the complete agent-facing dashboard with conversation list, chat view, visitor info panel, agent management, canned responses, knowledge base, and department management pages — all using real data from LC-01 tables and LC-02 actions  
**Independence**: Requires LC-01 (types + DB). Can run WITHOUT LC-02 if actions are created inline, but ideally run after LC-02  
**Estimated Files**: ~25 files (pages, wrappers, components)  
**Prerequisites**: LC-01 complete. LC-02 recommended but not strictly required

---

## CRITICAL RULES

1. Read `/memory-bank/systemPatterns.md` for ALL platform patterns before starting
2. Every server page: auth guard `if (!user) redirect('/login')` + module check `isModuleEnabledForSite`
3. Server pages fetch data via server actions, pass to client wrapper components
4. Client wrappers pass data + callbacks to presentational components
5. Use `'use client'` on all interactive components
6. Use shadcn/ui components from `@/components/ui/*`
7. Use Lucide React icons — NEVER emoji
8. Use Tailwind semantic tokens (bg-background, text-foreground, etc.) — no hex colors
9. Use `cn()` from `@/lib/utils` for className merging
10. Use `sonner` toast for notifications
11. Use `framer-motion` for transitions
12. Use locale-config for all currency/timezone
13. ZERO mock data
14. Run `npx tsc --noEmit` at the end — zero errors

---

## Task 1: Module Layout with Sub-Navigation

**File**: `next-platform-dashboard/src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/layout.tsx`

```
Server component layout:
1. Auth guard: getUser() → if (!user) redirect('/login')
2. Module check: isModuleEnabledForSite(siteId, 'live-chat') → if not enabled, redirect to modules page
3. Render horizontal sub-navigation bar with MODULE_NAVIGATION.subMenu items
4. Replace [siteId] placeholder in hrefs with actual siteId
5. Highlight active nav item using usePathname() — BUT since this is a server component,
   create a small client component <LiveChatNav siteId={siteId} items={navItems} />
6. Render {children} below nav

Navigation items (from manifest):
- Overview (LayoutDashboard)
- Conversations (MessagesSquare)
- WhatsApp (MessageCircle)
- Agents (Users)
- Canned Responses (Zap)
- Knowledge Base (BookOpen)
- Analytics (ChartBar)
- Settings (Settings)

Pattern reference: src/app/(dashboard)/dashboard/sites/[siteId]/social/layout.tsx
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/LiveChatNav.tsx`

```
'use client' component for active nav highlighting.
Props: { siteId: string, items: Array<{ label: string, href: string, icon: string }> }
Use usePathname() to determine active state.
Render horizontal scrollable nav with icon + label for each item.
Active item gets border-bottom highlight and text-foreground color.
Inactive items get text-muted-foreground.
```

---

## Task 2: Overview Page (Dashboard Entry)

**File**: `next-platform-dashboard/src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/page.tsx`

```
Server page:
1. Auth guard
2. Get siteId from params
3. Call getConversationStats(siteId) for overview stats
4. Call getConversations(siteId, { status: 'active' }, 1, 5) for recent active chats
5. Call getAgents(siteId) for online agents
6. Pass to <LiveChatOverviewWrapper />
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/wrappers/LiveChatOverviewWrapper.tsx`

```
'use client' wrapper component.
Props: { stats: ChatOverviewStats, recentConversations: ConversationListItem[], agents: ChatAgent[], siteId: string }

Display:
1. Stats cards row (4 cards):
   - Active Conversations (count, MessagesSquare icon)
   - Pending (count, Clock icon)
   - Online Agents (count, Users icon)
   - Avg Response Time (formatted, Timer icon)
2. Second row (4 cards):
   - Today's Conversations (count)
   - Resolved Today (count)
   - Missed Today (count)
   - Satisfaction Score (percentage)
3. Recent Active Conversations list (compact, clickable → navigate to conversation)
4. Agent Status Grid (show agent cards with name, avatar, status badge, current load)
5. Quick actions: "Start a conversation" button, "Go to settings" link
```

---

## Task 3: Conversations List Page

**File**: `next-platform-dashboard/src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/conversations/page.tsx`

```
Server page:
1. Auth guard
2. Call getConversations(siteId, {}, 1, 20) for initial list
3. Call getAgents(siteId) for assignment dropdown
4. Call getDepartments(siteId) for filter dropdown
5. Pass to <ConversationsPageWrapper />
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/wrappers/ConversationsPageWrapper.tsx`

```
'use client' wrapper.
Props: { initialConversations, total, agents, departments, siteId }

Features:
1. Filter bar: Status (all/pending/active/waiting/resolved/closed/missed), Channel (all/widget/whatsapp), Agent (all/unassigned/specific), Priority, Search
2. Conversation list with pagination (load more button, not infinite scroll)
3. Each conversation shows: visitor name/avatar, channel badge (widget/whatsapp), status badge, priority badge, last message preview, time ago, unread count, assigned agent avatar
4. Click conversation → navigate to /conversations/[id]
5. Bulk actions: Assign to agent, Resolve, Close
6. Realtime updates via useConversationsRealtime hook (new conversations appear at top)
7. Empty state when no conversations
```

---

## Task 4: Single Conversation View

**File**: `next-platform-dashboard/src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/conversations/[conversationId]/page.tsx`

```
Server page:
1. Auth guard
2. Get conversationId from params
3. Call getConversation(conversationId)
4. Call getMessages(conversationId, 1, 50)
5. Call getAgents(siteId) for transfer/assign dropdown
6. Call getDepartments(siteId)
7. Call getCannedResponses(siteId)
8. Call getVisitor(conversation.visitorId)
9. Pass to <ConversationViewWrapper />
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/wrappers/ConversationViewWrapper.tsx`

```
'use client' wrapper — THE MAIN AGENT CHAT INTERFACE
Props: { conversation, initialMessages, agents, departments, cannedResponses, visitor, siteId }

Three-panel layout (resizable):
LEFT PANEL (conversation list — optional sidebar, collapsible):
  - Mini conversation list for quick switching
  - Filter by status

CENTER PANEL (chat area):
  1. Conversation header: visitor name, channel badge, status dropdown, priority dropdown, assigned agent
  2. Message list: auto-scroll to bottom, load older messages button at top
  3. Message bubbles: different alignment for visitor (left) vs agent (right)
     - Each bubble: sender name, avatar, message content, timestamp, status indicators
     - System messages: centered, muted text
     - Internal notes: highlighted with yellow/amber background, "Note" badge
     - File messages: preview for images, download button for documents
     - AI messages: subtle AI badge
  4. Typing indicator: "Visitor is typing..." with animated dots
  5. Message input area:
     - Rich text input (basic formatting)
     - Canned response picker (/ shortcut to search)
     - File upload button
     - Emoji picker (optional)
     - Internal note toggle (switch between public reply and internal note)
     - Send button (Enter or Ctrl+Enter)
  6. Realtime: useChatRealtime hook for live message updates

RIGHT PANEL (visitor info — collapsible):
  1. Visitor details card: name, email, phone, avatar
  2. Location: country, city
  3. Device info: browser, OS, device
  4. Current page URL
  5. Tags (editable)
  6. Notes (editable)
  7. Custom data (JSON viewer)
  8. Conversation history (list of previous conversations)
  9. CRM link (if linked to CRM contact, show link)
  10. Quick actions: Link to CRM, Add tag, Update priority

Action bar (top of conversation):
  - Assign to Agent dropdown
  - Transfer to Department/Agent
  - Resolve conversation button
  - Close conversation button
  - More menu: Reopen, Print transcript, Email transcript
```

---

## Task 5: Agents Management Page

**File**: `next-platform-dashboard/src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/agents/page.tsx`

```
Server page:
1. Auth guard
2. Call getAgents(siteId)
3. Call getDepartments(siteId)
4. Call getAgentPerformance(siteId) for performance stats
5. Pass to <AgentsPageWrapper />
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/wrappers/AgentsPageWrapper.tsx`

```
'use client' wrapper.

Features:
1. Agent list with status indicators (green dot = online, yellow = away, red = busy, gray = offline)
2. Each agent card shows: avatar, name, email, role badge, department, current load, total handled, avg response time, avg rating
3. Add Agent dialog: select user from agency_members, set role, department, max concurrent chats
4. Edit Agent dialog: update role, department, max concurrent chats, active status
5. Department management section:
   - List departments with agent counts
   - Add department dialog (name, description, auto-assign toggle)
   - Edit department dialog
   - Set default department
   - Delete department (with confirmation)
6. Performance table: sortable by total chats, response time, rating
```

---

## Task 6: Canned Responses Page

**File**: `next-platform-dashboard/src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/canned-responses/page.tsx`

```
Server page:
1. Auth guard
2. Call getCannedResponses(siteId)
3. Pass to <CannedResponsesPageWrapper />
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/wrappers/CannedResponsesPageWrapper.tsx`

```
'use client' wrapper.

Features:
1. Grid/list toggle view
2. Each response card: title, shortcut badge, category badge, preview of content, usage count
3. Create response dialog: title, content (rich text), shortcut (e.g., /greeting), category, tags, shared toggle
4. Edit response dialog
5. Delete with confirmation
6. Search bar
7. Category filter tabs
8. Test preview: type / in an input to see how shortcut works
```

---

## Task 7: Knowledge Base Page

**File**: `next-platform-dashboard/src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/knowledge-base/page.tsx`

```
Server page:
1. Auth guard
2. Call getKnowledgeBaseArticles(siteId)
3. Pass to <KnowledgeBasePageWrapper />
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/wrappers/KnowledgeBasePageWrapper.tsx`

```
'use client' wrapper.

Features:
1. Article list with category grouping
2. Each article: title, category badge, content preview, usage count, last matched date
3. Create article dialog: title, content (TipTap or textarea), category, tags
4. Edit article dialog
5. Delete with confirmation
6. Search bar
7. Category filter
8. Info banner explaining: "AI will use these articles to auto-respond to common questions"
```

---

## Task 8: WhatsApp Conversations Page (Placeholder for LC-05)

**File**: `next-platform-dashboard/src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/whatsapp/page.tsx`

```
Server page:
1. Auth guard
2. Call getConversations(siteId, { channel: 'whatsapp' })
3. If WhatsApp not configured (check widget settings), show setup prompt
4. If configured, show WhatsApp conversation list (same component as conversations page but filtered)
5. Pass to <WhatsAppPageWrapper /> or reuse ConversationsPageWrapper with channel filter
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/wrappers/WhatsAppPageWrapper.tsx`

```
'use client' wrapper.

If WhatsApp not configured:
  - Show setup card with instructions
  - Link to Settings page
  - Show WhatsApp Business API requirements

If configured:
  - Same conversation list as main conversations but filtered to channel: 'whatsapp'
  - WhatsApp-specific features: Template message sender, 24-hour window indicator
  - Each conversation shows WhatsApp icon and phone number
```

---

## Task 9: Shared UI Components

Create these shared components used across multiple pages:

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/ConversationStatusBadge.tsx`
```
Badge component showing conversation status with appropriate colors:
- pending: yellow/amber
- active: green  
- waiting: blue
- resolved: gray
- closed: gray/muted
- missed: red
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/ChannelBadge.tsx`
```
Badge showing conversation channel:
- widget: MessageCircle icon + "Widget"
- whatsapp: Phone icon + "WhatsApp" (green tinted)
- api: Code icon + "API"
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/PriorityBadge.tsx`
```
Badge for priority:
- low: muted
- normal: default
- high: orange
- urgent: red with animation
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/AgentStatusDot.tsx`
```
Small colored dot indicating agent status:
- online: green
- away: yellow
- busy: red
- offline: gray
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/MessageBubble.tsx`
```
Message display component:
- Different alignment: visitor (left), agent (right), system (center)
- Avatar + name for sender
- Timestamp
- Status indicators (sent/delivered/read) for agent messages
- Internal note styling (amber/yellow highlight)
- File attachment rendering (image preview or file download)
- AI generated badge
- Content types: text, image, file, system, note
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/TypingIndicator.tsx`
```
Animated typing indicator: three dots bouncing
Shows "[Name] is typing..." with animation
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/MessageInput.tsx`
```
Message composition input:
- Textarea with auto-resize
- Enter to send (Shift+Enter for newline) or Ctrl+Enter to send
- File upload button (opens file picker)
- Canned response trigger: when user types "/", show searchable dropdown of canned responses
- Internal note toggle button
- Send button with loading state
- Character count (optional)
Props: onSend, onFileUpload, cannedResponses, isInternalNote, setIsInternalNote
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/SatisfactionRating.tsx`
```
Star rating display (1-5 stars) and input component.
For display: filled stars based on rating value
For input: clickable stars with optional comment textarea
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/LiveChatEmptyState.tsx`
```
Reusable empty state component:
Props: { icon: LucideIcon, title: string, description: string, action?: { label: string, onClick: () => void } }
Renders centered icon + text + optional CTA button
```

---

## Task 10: Error Boundaries & Loading States

Create error.tsx and loading.tsx for all routes:

**Files** (one pair per route):
```
live-chat/error.tsx
live-chat/loading.tsx
live-chat/conversations/error.tsx
live-chat/conversations/loading.tsx
live-chat/conversations/[conversationId]/error.tsx
live-chat/conversations/[conversationId]/loading.tsx
live-chat/whatsapp/error.tsx
live-chat/whatsapp/loading.tsx
live-chat/agents/error.tsx
live-chat/agents/loading.tsx
live-chat/canned-responses/error.tsx
live-chat/canned-responses/loading.tsx
live-chat/knowledge-base/error.tsx
live-chat/knowledge-base/loading.tsx
live-chat/analytics/error.tsx      (placeholder for LC-07)
live-chat/analytics/loading.tsx    (placeholder for LC-07)
live-chat/settings/error.tsx       (placeholder for LC-04)
live-chat/settings/loading.tsx     (placeholder for LC-04)
```

Each error.tsx:
```
'use client'
Standard error boundary with "Something went wrong" message and retry button.
Follow pattern from social media module error.tsx files.
```

Each loading.tsx:
```
Skeleton loading state appropriate for the page content.
- Overview: 4 stat card skeletons + conversation list skeleton
- Conversations: filter bar skeleton + conversation item skeletons
- Conversation view: three-panel skeleton
- Agents: agent card grid skeleton
- etc.
```

---

## Verification Checklist

1. [ ] Layout with sub-navigation renders correctly
2. [ ] Overview page shows real stats from database
3. [ ] Conversations list with filters, pagination, and realtime updates
4. [ ] Single conversation view with messages, visitor info, and actions
5. [ ] Agents page with CRUD and performance metrics
6. [ ] Canned responses CRUD works
7. [ ] Knowledge base CRUD works
8. [ ] WhatsApp page shows setup prompt or filtered conversations
9. [ ] All shared components render correctly
10. [ ] Error boundaries on all routes
11. [ ] Loading skeletons on all routes
12. [ ] No mock data anywhere
13. [ ] All navigation items work and highlight correctly
14. [ ] `npx tsc --noEmit` passes with zero errors

### Testing Instructions
1. Navigate to `/dashboard/sites/[siteId]/live-chat/` — should see overview
2. Click each nav item — should navigate correctly
3. Create an agent, department, canned response, knowledge base article
4. Create a test conversation (via SQL or API) and verify it appears in the list
5. Click into a conversation — should see message view
6. Send a test message — should appear in the conversation
7. Test conversation actions: assign, transfer, resolve, close, reopen
8. Test canned response shortcut (type / in message input)
9. Verify all loading states and error boundaries
10. Commit: `git add -A && git commit -m "feat(live-chat): PHASE-LC-03: agent dashboard — full conversation management UI" && git push`
