# PHASE LC-00: Live Chat & WhatsApp Module — Master Plan

**Module**: Live Chat & Omnichannel Messaging  
**Goal**: Build an industry-leading live chat system with WhatsApp Business integration, AI-powered agents, real-time conversations, embeddable widget, and full agent dashboard — rivaling Intercom, Zendesk Chat, Tidio, and Crisp  
**Status**: Planning Complete  
**Last Updated**: February 2026

---

## Vision

The Live Chat module transforms DRAMAC into a complete customer communication platform. Agencies install it on client sites to provide:

1. **Embeddable Chat Widget** — Customizable widget on any website (on/off platform)
2. **Agent Dashboard** — Real-time conversation management for support teams
3. **WhatsApp Business** — Send/receive WhatsApp messages from the same dashboard
4. **AI Auto-Responder** — Claude-powered responses when agents are offline/busy
5. **Conversation Routing** — Auto-assign to departments/agents based on rules
6. **Analytics & Reporting** — Response times, satisfaction scores, agent performance
7. **CRM Integration** — Conversations linked to CRM contacts, activities logged
8. **Canned Responses** — Quick reply templates with keyboard shortcuts
9. **File Sharing** — Image, document, and media exchange
10. **Multi-Channel Inbox** — Widget chat + WhatsApp + email in one unified view

---

## Industry Leaders Analysis & Feature Parity

### What Industry Leaders Have (Intercom, Zendesk, Tidio, Crisp, Tawk.to)

| Feature | Intercom | Zendesk | Tidio | Crisp | Our Module |
|---------|----------|---------|-------|-------|------------|
| Embeddable widget | ✅ | ✅ | ✅ | ✅ | ✅ LC-04 |
| Real-time messaging | ✅ | ✅ | ✅ | ✅ | ✅ LC-02 |
| WhatsApp integration | ✅ | ✅ | ✅ | ✅ | ✅ LC-05 |
| AI auto-responder | ✅ | ✅ | ✅ | ✅ | ✅ LC-06 |
| Agent dashboard | ✅ | ✅ | ✅ | ✅ | ✅ LC-03 |
| Typing indicators | ✅ | ✅ | ✅ | ✅ | ✅ LC-02 |
| File sharing | ✅ | ✅ | ✅ | ✅ | ✅ LC-02 |
| Canned responses | ✅ | ✅ | ✅ | ✅ | ✅ LC-03 |
| Pre-chat forms | ✅ | ✅ | ✅ | ✅ | ✅ LC-04 |
| Offline messages | ✅ | ✅ | ✅ | ✅ | ✅ LC-04 |
| Visitor tracking | ✅ | ✅ | ❌ | ✅ | ✅ LC-04 |
| Conversation routing | ✅ | ✅ | ✅ | ✅ | ✅ LC-06 |
| Satisfaction ratings | ✅ | ✅ | ✅ | ✅ | ✅ LC-02 |
| Analytics dashboard | ✅ | ✅ | ✅ | ✅ | ✅ LC-07 |
| Agent performance | ✅ | ✅ | ✅ | ✅ | ✅ LC-07 |
| Department routing | ✅ | ✅ | ✅ | ✅ | ✅ LC-06 |
| Business hours | ✅ | ✅ | ✅ | ✅ | ✅ LC-04 |
| Multi-language | ✅ | ✅ | ✅ | ✅ | ✅ LC-04 |
| Custom branding | ✅ | ✅ | ✅ | ✅ | ✅ LC-04 |
| Conversation tags | ✅ | ✅ | ✅ | ✅ | ✅ LC-02 |
| Internal notes | ✅ | ✅ | ✅ | ✅ | ✅ LC-03 |
| Conversation transfer | ✅ | ✅ | ✅ | ✅ | ✅ LC-03 |
| Sound notifications | ✅ | ✅ | ✅ | ✅ | ✅ LC-04 |
| Email transcripts | ✅ | ✅ | ✅ | ✅ | ✅ LC-07 |
| Webhook integrations | ✅ | ✅ | ✅ | ✅ | ✅ LC-08 |

---

## Current State Assessment

### What Exists
- ✅ Module registered in catalog as `live-chat` (slug), `mod_communication_chat` (id)
- ✅ Seeded in `modules_v2` table with pricing (K24.99/mo) and mount points
- ✅ Communication category registered with `MessageCircle` icon
- ✅ Old EM-53 phase doc exists (outdated, Socket.IO-based, no WhatsApp)
- ✅ Social media inbox provides reference architecture for messaging UI
- ✅ Supabase Realtime already used in platform (module-sync, cart widgets)
- ✅ Notification system supports new types
- ✅ Email system supports new template types

### What's Missing (100% of implementation)
- ❌ Zero database tables for chat
- ❌ Zero module code (`src/modules/live-chat/` doesn't exist)
- ❌ Zero routes (`/dashboard/[siteId]/live-chat/` doesn't exist)
- ❌ Zero widget code
- ❌ Zero WhatsApp integration
- ❌ Zero real-time messaging implementation
- ❌ Zero AI auto-responder
- ❌ Zero analytics

---

## Architecture Decisions

### 1. Real-Time: Supabase Realtime (NOT Socket.IO)
**Why**: The old EM-53 spec used Socket.IO which requires a separate WebSocket server. Our platform runs on Vercel (serverless) — Socket.IO would need a separate hosted service. Supabase Realtime is:
- Already in our stack and working (module-sync, cart)
- Supports channels, presence, and broadcast
- No additional infrastructure needed
- Built-in authentication via Supabase tokens

**Implementation**:
- **Channels**: Per-conversation channel for messages
- **Presence**: Agent online/offline/busy status + typing indicators
- **Broadcast**: New message notifications, assignment changes
- **Postgres Changes**: Listen on `mod_chat_messages` for new inserts

### 2. WhatsApp: Meta Cloud API (Official)
**Why**: WhatsApp Business Platform (Cloud API) is the official way. No third-party proxies.
- Free to receive messages
- Per-conversation pricing for business-initiated (template messages)
- Supports text, images, documents, location, buttons, lists
- Webhook for incoming messages
- 24-hour customer service window (free replies within 24h of customer message)

**Implementation**:
- WhatsApp Business Account linked per site
- Webhook at `/api/modules/live-chat/webhooks/whatsapp`
- Messages stored in same `mod_chat_messages` table with `channel: 'whatsapp'`
- Unified inbox shows WhatsApp alongside widget conversations
- Template message support for outbound messaging

### 3. AI: Claude via AI SDK (Existing Pattern)
**Why**: Already using Anthropic Claude for AI content in social media module.
- Auto-respond when no agents online
- Suggest responses for agents
- Summarize conversations
- Detect intent and route to departments
- Answer FAQs from knowledge base

### 4. Database Prefix: `mod_chat_`
Following the module database pattern. All tables prefixed with `mod_chat_`.

### 5. Module Folder: `src/modules/live-chat/`
Following the exact same structure as booking, ecommerce, social-media modules.

---

## Phase Breakdown (8 Implementation Phases)

| Phase | Name | Independence | Est. Files | Connection Points |
|-------|------|-------------|------------|-------------------|
| **LC-01** | Database Schema & Types | Fully independent | ~8 | Foundation for all phases |
| **LC-02** | Core Chat Engine | Requires LC-01 | ~15 | Real-time messaging core |
| **LC-03** | Agent Dashboard | Requires LC-01 | ~20 | Dashboard UI for agents |
| **LC-04** | Embeddable Widget | Requires LC-01, LC-02 | ~12 | Customer-facing widget |
| **LC-05** | WhatsApp Integration | Requires LC-01, LC-02 | ~10 | WhatsApp Cloud API |
| **LC-06** | AI & Smart Routing | Requires LC-01, LC-02 | ~10 | AI auto-responder + routing |
| **LC-07** | Analytics & Reporting | Requires LC-01 | ~10 | Dashboards and reports |
| **LC-08** | Production Hardening | Run LAST | ~15 | Final QA + polish |

### Dependency Graph
```
LC-01 (Database & Types) ──┬──> LC-02 (Core Engine) ──┬──> LC-04 (Widget)
                           │                          ├──> LC-05 (WhatsApp)
                           │                          └──> LC-06 (AI & Routing)
                           ├──> LC-03 (Agent Dashboard)
                           └──> LC-07 (Analytics)

LC-08 (Hardening) → Run LAST after ALL others
```

### Execution Order
1. **LC-01** first (database + types are foundation)
2. **LC-02** next (core engine needed by widget, WhatsApp, AI)
3. **LC-03** + **LC-07** can run in parallel (both only need LC-01)
4. **LC-04** + **LC-05** + **LC-06** can run in parallel (all need LC-01 + LC-02)
5. **LC-08** last (final sweep)

---

## Environment Variables Required

```env
# WhatsApp Business API (Meta Cloud API)
WHATSAPP_PHONE_NUMBER_ID=          # Your WhatsApp Business phone number ID
WHATSAPP_BUSINESS_ACCOUNT_ID=      # Your WhatsApp Business Account ID
WHATSAPP_ACCESS_TOKEN=             # Permanent access token (System User)
WHATSAPP_VERIFY_TOKEN=             # Webhook verification token (you set this)
WHATSAPP_APP_SECRET=               # For webhook signature verification

# AI (already exists)
ANTHROPIC_API_KEY=                 # Already in use for social media AI

# Already in .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Database Tables Overview (9 tables)

| Table | Purpose | Phase |
|-------|---------|-------|
| `mod_chat_departments` | Department/team routing groups | LC-01 |
| `mod_chat_agents` | Agent profiles, status, capacity | LC-01 |
| `mod_chat_widget_settings` | Per-site widget customization | LC-01 |
| `mod_chat_visitors` | Website visitors who initiate chat | LC-01 |
| `mod_chat_conversations` | Conversation threads (widget + WhatsApp) | LC-01 |
| `mod_chat_messages` | Individual messages within conversations | LC-01 |
| `mod_chat_canned_responses` | Quick reply templates | LC-01 |
| `mod_chat_knowledge_base` | FAQ/knowledge articles for AI | LC-01 |
| `mod_chat_analytics` | Daily aggregated metrics | LC-01 |

---

## Module Navigation (Dashboard)

```
/dashboard/sites/[siteId]/live-chat/
├── /                          → Overview (active chats, quick stats)
├── /conversations              → All conversations (active, pending, resolved)
├── /conversations/[id]         → Single conversation view
├── /whatsapp                   → WhatsApp-specific conversations
├── /agents                     → Manage agents & departments
├── /canned-responses           → Quick reply templates
├── /knowledge-base             → AI knowledge base articles
├── /analytics                  → Performance dashboards
├── /settings                   → Widget config, business hours, notifications
```

---

## Global Rules for All Phases

### Code Patterns
1. **Server Actions** — `'use server'` directive, `createClient` from `@/lib/supabase/server`
2. **Locale** — Import from `@/lib/locale-config` (ZMW, Africa/Lusaka, en-ZM)
3. **Icons** — Lucide React only, never emoji
4. **Theming** — Tailwind semantic tokens only (bg-background, text-foreground, etc.)
5. **Currency** — Always `formatCurrency()` for money. Symbol is `K` (ZMW)
6. **DB** — Tables prefixed `mod_chat_`. Use `(supabase as any).from('mod_chat_...')` pattern
7. **Types** — All types in `src/modules/live-chat/types/index.ts`
8. **Components** — shadcn/ui from `@/components/ui/*`
9. **Toast** — `sonner` for notifications
10. **Animation** — `framer-motion` for transitions
11. **Charts** — `recharts` for analytics visualization
12. **DB Mapping** — Use `mapRecord()`/`mapRecords()` from `lib/map-db-record.ts`
13. **Error Handling** — Try/catch, return `{ data, error }` pattern
14. **No mock data** — Zero hardcoded numbers, zero `Math.random()`, zero placeholders
15. **Auth guards** — Every server page: `if (!user) redirect('/login')`
16. **Module check** — Every page: `isModuleEnabledForSite(siteId, 'live-chat')`
17. **Realtime** — Use Supabase Realtime channels, NOT Socket.IO

### Verification After Each Phase
```bash
cd next-platform-dashboard
npx tsc --noEmit
# Zero errors required before commit

git add -A
git commit -m "feat(live-chat): PHASE-LC-XX: [description]"
git push
```

### File Structure
```
src/modules/live-chat/
├── actions/
│   ├── conversation-actions.ts
│   ├── message-actions.ts
│   ├── agent-actions.ts
│   ├── department-actions.ts
│   ├── canned-response-actions.ts
│   ├── widget-actions.ts
│   ├── analytics-actions.ts
│   ├── whatsapp-actions.ts
│   ├── knowledge-base-actions.ts
│   └── index.ts
├── components/
│   ├── agent-dashboard/
│   │   ├── AgentDashboard.tsx
│   │   ├── ConversationList.tsx
│   │   ├── ConversationView.tsx
│   │   ├── VisitorInfoPanel.tsx
│   │   ├── AgentStatusSelector.tsx
│   │   └── InternalNotes.tsx
│   ├── widget/
│   │   ├── ChatWidget.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── PreChatForm.tsx
│   │   ├── MessageBubble.tsx
│   │   └── WidgetLauncher.tsx
│   ├── shared/
│   │   ├── MessageInput.tsx
│   │   ├── FileUploader.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── SatisfactionRating.tsx
│   │   └── ConversationStatus.tsx
│   ├── settings/
│   │   ├── WidgetSettings.tsx
│   │   ├── BusinessHours.tsx
│   │   ├── NotificationSettings.tsx
│   │   └── WhatsAppSetup.tsx
│   ├── analytics/
│   │   ├── ChatAnalyticsDashboard.tsx
│   │   ├── AgentPerformance.tsx
│   │   └── ConversationMetrics.tsx
│   └── wrappers/
│       ├── DashboardWrapper.tsx
│       ├── ConversationsWrapper.tsx
│       └── AnalyticsWrapper.tsx
├── lib/
│   ├── map-db-record.ts
│   ├── realtime-service.ts
│   ├── whatsapp-service.ts
│   ├── ai-responder.ts
│   └── routing-engine.ts
├── hooks/
│   ├── use-chat-realtime.ts
│   ├── use-agent-presence.ts
│   └── use-typing-indicator.ts
├── types/
│   └── index.ts
├── manifest.ts
└── index.ts
```

### Route Structure
```
src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/
├── layout.tsx
├── page.tsx                           → Overview
├── conversations/
│   ├── page.tsx                       → Conversation list
│   └── [conversationId]/
│       └── page.tsx                   → Single conversation
├── whatsapp/
│   └── page.tsx                       → WhatsApp conversations
├── agents/
│   └── page.tsx                       → Agent management
├── canned-responses/
│   └── page.tsx                       → Quick replies
├── knowledge-base/
│   └── page.tsx                       → AI knowledge base
├── analytics/
│   └── page.tsx                       → Analytics dashboard
└── settings/
    └── page.tsx                       → Widget & integration settings

src/app/api/modules/live-chat/
├── widget/
│   └── route.ts                       → Widget config endpoint (public)
├── messages/
│   └── route.ts                       → Message send/receive (authenticated)
├── webhooks/
│   └── whatsapp/
│       └── route.ts                   → WhatsApp webhook receiver
└── embed/
    └── route.ts                       → Widget embed script
```

---

## Integration Points

### With CRM Module
- New conversations auto-create or link to CRM contacts
- Chat activity logged to CRM activity feed (type: 'chat')
- Visitor info enriched from CRM data

### With Notification System
- New notification types: `new_chat_message`, `chat_assigned`, `chat_missed`, `chat_rating_received`
- Desktop browser notifications for agents
- Email notifications for offline agents

### With Email System
- Chat transcript sent to customer after conversation closes
- Missed chat notification to site owner
- New email types: `chat_transcript`, `chat_missed`

### With Automation Module
- Trigger: `chat.conversation.created`, `chat.message.received`, `chat.conversation.resolved`
- Action: Send chat message, assign agent, add tag

### With Booking Module
- Agent can create booking from within chat conversation
- "Book Now" quick action in agent dashboard

### With E-Commerce Module
- Agent can see customer's cart/orders in visitor info panel
- "View Order" quick action in agent dashboard
