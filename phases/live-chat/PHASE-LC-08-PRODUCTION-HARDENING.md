# PHASE LC-08: Production Hardening, Integration & Final QA

**Phase**: LC-08  
**Module**: Live Chat & Omnichannel Messaging  
**Goal**: Final production hardening — integrate with platform navigation, connect all module cross-references, add comprehensive error boundaries, fix any TypeScript errors, remove any remaining mock data, ensure all pages display real data, and perform complete end-to-end QA  
**Independence**: Run LAST — after ALL other LC phases (LC-01 through LC-07)  
**Estimated Files**: ~20 files (modifications + new error handling files)  
**Prerequisites**: All LC-01 through LC-07 phases complete

---

## CRITICAL RULES

1. Read `/memory-bank/systemPatterns.md` for ALL platform patterns before starting
2. This phase is the FINAL sweep — everything must work after this
3. ZERO mock data, ZERO hardcoded numbers, ZERO placeholders
4. ZERO TypeScript errors (`npx tsc --noEmit` must pass)
5. All error boundaries must be in place
6. All loading states must be proper skeletons (not just text)
7. Navigation must be wired into the platform sidebar
8. Module must be gated by `isModuleEnabledForSite`
9. All real-time subscriptions must clean up properly
10. All API routes must validate inputs and handle errors

---

## Task 1: Platform Navigation Integration

Wire the live chat module into the main platform sidebar navigation.

**File**: Modify `next-platform-dashboard/src/components/layout/sidebar.tsx` (or wherever the site-level navigation is defined)

```
Add "Live Chat" navigation item to the site-level sidebar:
- Icon: MessageCircle from lucide-react
- Label: "Live Chat"
- Href: /dashboard/sites/[siteId]/live-chat
- Only show when live-chat module is enabled for the site
- Position: after Social Media, before other modules
- Use the ModuleGate or isModuleEnabled check pattern

The implementing AI should:
1. Find where site-level navigation items are defined
2. Find the pattern for conditional module nav items (check how social-media, booking, ecommerce are listed)
3. Add live-chat following the same pattern
4. Ensure the icon imports correctly from lucide-react
```

---

## Task 2: Module Registration

Ensure the live-chat module is properly registered in all module systems:

**Check and update these files:**

1. `src/modules/_registry.ts` — If this registry is used, add live-chat module
2. `src/lib/modules/module-catalog.ts` — Verify the live-chat entry exists (it should from earlier setup). If features list needs updating, add all new features (WhatsApp, AI auto-responder, Agent dashboard, etc.)
3. `src/lib/modules/module-registry.ts` or similar — If module registration patterns exist, ensure live-chat is included
4. Module installation check — Verify `isModuleEnabledForSite(siteId, 'live-chat')` works correctly by checking the live-chat slug matches what's in the database

---

## Task 3: Cross-Module Integration Verification

Verify and fix all integration points:

### CRM Integration
```
1. When a chat starts, check if visitor email matches a CRM contact
2. If match found, link visitor to CRM contact (crm_contact_id)
3. Log chat activity in CRM activity feed (type: 'chat')
4. Verify CRM activity component shows chat activities correctly
5. In conversation view, if visitor is linked to CRM, show "View in CRM" link
```

### Notification System
```
1. Verify notification types are registered:
   - new_chat_message
   - chat_assigned
   - chat_missed
   - chat_rating_received
2. Verify notifications appear in the notification bell
3. Verify notification click navigates to the conversation
4. Verify email templates render correctly for:
   - chat_transcript
   - chat_missed
```

### Email System
```
1. Verify email types are in EmailType union
2. Verify branded templates exist and render correctly
3. Test sending transcript email
4. Test sending missed chat email
```

### Automation Module (if applicable)
```
1. Verify chat events can trigger automations (if automation integration was added in LC-06)
2. Test: new chat → trigger automation → send notification
```

---

## Task 4: Error Boundary Audit

Verify EVERY route has error.tsx and loading.tsx:

```
src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/
├── error.tsx                              ✓ must exist
├── loading.tsx                            ✓ must exist
├── conversations/
│   ├── error.tsx                          ✓ must exist
│   ├── loading.tsx                        ✓ must exist
│   └── [conversationId]/
│       ├── error.tsx                      ✓ must exist
│       └── loading.tsx                    ✓ must exist
├── whatsapp/
│   ├── error.tsx                          ✓ must exist
│   └── loading.tsx                        ✓ must exist
├── agents/
│   ├── error.tsx                          ✓ must exist
│   └── loading.tsx                        ✓ must exist
├── canned-responses/
│   ├── error.tsx                          ✓ must exist
│   └── loading.tsx                        ✓ must exist
├── knowledge-base/
│   ├── error.tsx                          ✓ must exist
│   └── loading.tsx                        ✓ must exist
├── analytics/
│   ├── error.tsx                          ✓ must exist
│   └── loading.tsx                        ✓ must exist
└── settings/
    ├── error.tsx                          ✓ must exist
    └── loading.tsx                        ✓ must exist
```

Each error.tsx must:
- Be a `'use client'` component
- Accept `{ error, reset }` props
- Show "Something went wrong" with module-specific context
- Have a "Try Again" button that calls reset()
- Have a "Go Back" link
- Use the module's icon (MessageCircle)

Each loading.tsx must:
- Show a tailored skeleton (not just a spinner)
- Match the layout of the actual page content
- Use proper skeleton animations

---

## Task 5: Data Integrity Audit

Scan ALL files for mock data and fix:

```
SEARCH FOR AND REMOVE:
- Math.random() — Replace with real data or 0
- Hardcoded numbers (followers: 12543, etc.) — Replace with DB queries
- "John Doe", "Jane Smith" — Replace with real data or empty
- "example.com" — Replace with real domains
- "Coming soon" — Replace with actual implementation or proper empty state
- "TODO" comments — Implement or document as known limitation
- console.log statements — Remove or convert to proper logging
- Placeholder image URLs — Use actual media or fallback icon
- Mock IDs (uuid-looking strings) — Replace with DB IDs
```

---

## Task 6: Performance Optimization

### Realtime Subscription Cleanup
```
Audit all hooks that create Supabase Realtime channels:
1. use-chat-realtime.ts — verify channel.unsubscribe() in cleanup
2. use-agent-presence.ts — verify channel.untrack() + unsubscribe()
3. use-conversations-realtime.ts — verify cleanup
4. Ensure no duplicate subscriptions (useRef pattern for channel)
5. Ensure channels are properly named to avoid conflicts
```

### Query Optimization
```
1. Verify indexes are in the migration (all should be from LC-01)
2. Check for N+1 queries in conversation list (should use joins, not separate queries)
3. Pagination should use LIMIT/OFFSET, not loading all records
4. Message loading should be cursor-based for large conversations
```

### Bundle Size
```
1. Widget components should be code-split (dynamic imports)
2. Large components (conversation view) should lazy-load non-critical panels
3. Charts should only import from recharts what they need
```

---

## Task 7: Accessibility Audit

```
1. All interactive elements have proper ARIA labels
2. Keyboard navigation works in:
   - Conversation list (arrow keys to navigate, Enter to select)
   - Message input (Enter to send, Tab to move between controls)
   - Canned response picker (arrow keys + Enter)
   - Widget launcher and chat interface
3. Screen reader compatibility:
   - New messages announced via aria-live region
   - Status changes announced
   - "X new messages" count announced
4. Color contrast: all text meets WCAG AA standard
5. Focus management: focus moves to correct element after actions
```

---

## Task 8: Widget Security Hardening

```
1. Widget API routes validate siteId parameter
2. Visitor identity is verified (conversationId + visitorId match)
3. Rate limiting on message sending (max 1 message per second per visitor)
4. File upload validation (type, size from widget settings)
5. Input sanitization (XSS prevention on message content)
6. CORS headers on widget API routes (allow configured domains)
7. CSP headers for widget iframe
8. No sensitive data exposed to widget (no agent emails, no internal notes)
```

---

## Task 9: TypeScript Strict Compliance

Run full TypeScript check and fix ALL errors:

```bash
cd next-platform-dashboard
npx tsc --noEmit
```

Common issues to fix:
1. Missing type imports
2. `any` types that should be specific
3. Null safety issues (missing null checks)
4. Return type mismatches
5. Import path issues
6. Unused variables/imports
7. Props interface mismatches between parent and child components

---

## Task 10: Documentation & Memory Bank Update

1. Update `memory-bank/activeContext.md` with:
   - Live Chat module implementation complete
   - All phases, files created, key decisions
   - WhatsApp integration status
   - Known limitations

2. Update `memory-bank/progress.md` with:
   - LC-01 through LC-08 status (all complete)
   - File counts and commit hashes
   - What works, what needs API keys

3. Update module catalog features list if needed

4. Create testing guide summary at the top of `phases/live-chat/PHASE-LC-00-MASTER-PLAN.md`

---

## Task 11: End-to-End Testing Scenarios

The implementing AI should manually verify these scenarios work:

### Scenario 1: Full Widget Chat Flow
```
1. Install live-chat module on a test site
2. Open the published site → widget launcher appears
3. Click launcher → pre-chat form shows
4. Fill form → chat opens → visitor sees welcome message
5. Send a message → message appears for agent in dashboard
6. Agent replies → message appears in widget
7. Agent resolves → rating prompt shows in widget
8. Visitor rates → rating stored in DB
9. Verify: conversation appears in analytics
```

### Scenario 2: WhatsApp Flow
```
1. Configure WhatsApp settings with test credentials
2. Send WhatsApp message to business number
3. Message appears in dashboard under WhatsApp tab
4. Agent replies → message sent to WhatsApp
5. Verify 24h window tracking
6. Verify media messages (image/document)
```

### Scenario 3: AI Auto-Responder
```
1. All agents set to offline
2. Visitor starts chat via widget
3. AI should auto-respond using knowledge base
4. Visitor asks to speak to human
5. AI offers handoff, conversation goes to queue
6. Agent comes online → gets assigned
```

### Scenario 4: Agent Management
```
1. Create agents from team members
2. Create departments
3. Set agent status (online/offline)
4. Verify routing assigns to online agents
5. Verify concurrent chat limits
6. Verify agent performance metrics
```

### Scenario 5: Analytics
```
1. Have several conversations (resolved, missed, rated)
2. Navigate to analytics page
3. Verify all charts show real data
4. Change date range → data updates
5. Export CSV → verify data
6. Check agent performance table
```

---

## Verification Checklist

1. [ ] Navigation: Live Chat appears in site sidebar when module enabled
2. [ ] Navigation: Sub-navigation works correctly with active highlighting
3. [ ] Overview page: Shows real stats from database
4. [ ] Conversations: List, filter, paginate, search all work
5. [ ] Conversation view: Messages display, send, receive in real-time
6. [ ] Conversation actions: Assign, transfer, resolve, close, reopen all work
7. [ ] Typing indicators: Show in both widget and dashboard
8. [ ] Agents: CRUD, status management, performance metrics
9. [ ] Departments: CRUD, default department, auto-assign
10. [ ] Canned responses: CRUD, shortcut trigger in message input
11. [ ] Knowledge base: CRUD, used by AI responder
12. [ ] Widget: Renders on published sites, pre-chat form, messaging, rating
13. [ ] Widget: Offline form, business hours, sound notifications
14. [ ] WhatsApp: Webhook receives messages, replies work
15. [ ] WhatsApp: 24h window tracking, template messages
16. [ ] AI: Auto-responds when no agents online
17. [ ] AI: Suggests responses for agents
18. [ ] AI: Summarizes conversations
19. [ ] Routing: Assigns to least-loaded agent in correct department
20. [ ] Analytics: All charts show real data, date range works
21. [ ] Analytics: Export CSV works
22. [ ] Notifications: Chat notifications appear in notification bell
23. [ ] Notifications: Email notifications send correctly
24. [ ] CRM: Chat activity logged in CRM
25. [ ] Error boundaries: Every route has error.tsx and loading.tsx
26. [ ] No mock data: ZERO Math.random, ZERO hardcoded numbers
27. [ ] No placeholders: ZERO "coming soon", ZERO TODO in production code
28. [ ] TypeScript: `npx tsc --noEmit` passes with ZERO errors
29. [ ] Accessibility: Keyboard navigation, ARIA labels, screen reader support
30. [ ] Security: Input validation, rate limiting, CORS, signature verification
31. [ ] Cleanup: No console.log statements, no unused imports
32. [ ] Memory bank: Updated with implementation status

### Final Commit
```bash
npx tsc --noEmit
# Must show: 0 errors

git add -A
git commit -m "feat(live-chat): PHASE-LC-08: production hardening, integration & final QA — module complete"
git push
```

---

## Post-Completion: What's Production-Ready

After all 8 phases:

| Feature | Status |
|---------|--------|
| Database schema (9 tables) | ✅ Production-ready |
| TypeScript types | ✅ Complete |
| Server actions (8 action files, 50+ functions) | ✅ Production-ready |
| Realtime hooks (3 hooks) | ✅ Production-ready |
| Agent dashboard (8 pages) | ✅ Production-ready |
| Embeddable widget | ✅ Production-ready |
| Widget settings | ✅ Production-ready |
| WhatsApp integration | ✅ Ready (needs API credentials) |
| AI auto-responder | ✅ Ready (needs ANTHROPIC_API_KEY) |
| Smart routing engine | ✅ Production-ready |
| Analytics dashboard | ✅ Production-ready |
| Notifications | ✅ Integrated |
| CRM integration | ✅ Integrated |
| Error handling | ✅ Comprehensive |
| Accessibility | ✅ WCAG AA compliant |

### Required API Keys for Full Functionality
| Key | Required For | Fallback |
|-----|-------------|----------|
| ANTHROPIC_API_KEY | AI auto-responder, suggestions, summaries | Graceful skip (no AI features) |
| WHATSAPP_PHONE_NUMBER_ID | WhatsApp messaging | Module works without WhatsApp |
| WHATSAPP_ACCESS_TOKEN | WhatsApp messaging | Module works without WhatsApp |
| WHATSAPP_VERIFY_TOKEN | WhatsApp webhooks | Module works without WhatsApp |
| WHATSAPP_APP_SECRET | Webhook verification | Module works without WhatsApp |
