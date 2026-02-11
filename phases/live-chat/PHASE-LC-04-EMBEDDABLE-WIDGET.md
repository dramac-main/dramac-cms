# PHASE LC-04: Embeddable Chat Widget & Settings Page

**Phase**: LC-04  
**Module**: Live Chat & Omnichannel Messaging  
**Goal**: Build the customer-facing embeddable chat widget that can be placed on any website (on or off platform), plus the settings page for widget customization, business hours, and notification preferences  
**Independence**: Requires LC-01 (types + DB) and LC-02 (actions + realtime hooks)  
**Estimated Files**: ~15 files  
**Prerequisites**: LC-01, LC-02 complete

---

## CRITICAL RULES

1. Read `/memory-bank/systemPatterns.md` for ALL platform patterns before starting
2. The widget is a STANDALONE React component that renders in an iframe or directly on customer sites
3. Widget must work WITHOUT Supabase auth (anonymous visitors)
4. Widget uses API routes (not server actions) since it runs on external domains
5. Widget must be lightweight, fast-loading, and accessible
6. Widget must support customization via settings (colors, text, position, etc.)
7. Settings page is a standard dashboard page following existing patterns
8. ZERO mock data
9. Run `npx tsc --noEmit` at the end — zero errors

---

## Task 1: Widget API Routes

These routes handle widget communication. They are PUBLIC endpoints (no auth required for visitor-facing routes).

**File**: `next-platform-dashboard/src/app/api/modules/live-chat/widget/route.ts`

```typescript
// GET /api/modules/live-chat/widget?siteId=xxx
// Returns public widget settings for rendering the chat widget
// Uses admin client (service role) since anonymous visitors have no auth token
// Only returns appearance, branding, pre-chat, business hours, language fields
// Checks if module is enabled for the site
// Returns 404 if not enabled or site not found
```

**File**: `next-platform-dashboard/src/app/api/modules/live-chat/conversations/route.ts`

```typescript
// POST /api/modules/live-chat/conversations
// Creates a new conversation + visitor record from widget
// Body: { siteId, visitorData: { name, email, phone, browser, os, device, currentPageUrl, currentPageTitle, referrerUrl, landingPageUrl }, departmentId?, initialMessage? }
// Steps:
//   1. createOrUpdateVisitor using admin client
//   2. Create conversation with status 'pending', channel 'widget'
//   3. If initialMessage provided, insert first message with sender_type 'visitor'
//   4. Auto-assign to available agent if configured
//   5. Return { conversationId, visitorId }
// Uses admin client (bypasses RLS for anonymous access)

// GET /api/modules/live-chat/conversations?conversationId=xxx&visitorId=xxx
// Returns conversation details + messages for widget display
// Validates visitorId matches conversation.visitor_id (security)
// Returns { conversation, messages }
```

**File**: `next-platform-dashboard/src/app/api/modules/live-chat/messages/route.ts`

```typescript
// POST /api/modules/live-chat/messages
// Sends a message from visitor in widget
// Body: { conversationId, visitorId, content, contentType?, fileUrl?, fileName?, fileSize?, fileMimeType? }
// Validates visitorId matches conversation.visitor_id
// Inserts message with sender_type 'visitor'
// Returns { message }

// GET /api/modules/live-chat/messages?conversationId=xxx&visitorId=xxx&page=1
// Returns messages for a conversation (paginated)
// Validates visitorId
// Returns { messages, total }
```

**File**: `next-platform-dashboard/src/app/api/modules/live-chat/embed/route.ts`

```typescript
// GET /api/modules/live-chat/embed?siteId=xxx
// Returns the JavaScript embed snippet that sites include to load the widget
// Content-Type: application/javascript
// The script:
//   1. Creates an iframe pointing to /chat-widget?siteId=xxx
//   2. Positions it fixed at bottom-right (or configured position)
//   3. Creates a launcher button
//   4. Handles open/close toggle
//   5. Handles resize for mobile
//   6. Passes messages between parent and iframe via postMessage
```

---

## Task 2: Chat Widget Page

This is a standalone page that renders inside an iframe on customer sites.

**File**: `next-platform-dashboard/src/app/chat-widget/page.tsx`

```
This is NOT a dashboard page. It's a standalone page without dashboard layout.
- Does NOT use the (dashboard) layout
- Does NOT require auth
- Renders the ChatWidget component
- Gets siteId from searchParams
- Fetches widget settings from the API route
- Minimal page shell — just the widget component

The page is at /chat-widget?siteId=xxx and renders in an iframe.
```

**File**: `next-platform-dashboard/src/app/chat-widget/layout.tsx`

```
Minimal layout:
- No sidebar, no header, no navigation
- Just html > body with the widget content
- Include necessary CSS (tailwind)
- Set viewport for mobile responsiveness
- transparent background (widget handles its own background)
```

---

## Task 3: Chat Widget Component

**File**: `next-platform-dashboard/src/modules/live-chat/components/widget/ChatWidget.tsx`

```
'use client' component — THE CUSTOMER-FACING CHAT WIDGET

Props: { siteId: string, settings: ChatWidgetSettings }

States:
1. widgetState: 'launcher' | 'pre-chat' | 'chat' | 'rating' | 'offline'
2. messages: ChatMessage[]
3. conversationId: string | null
4. visitorId: string | null
5. isTyping: boolean (agent typing)
6. unreadCount: number

Flow:
1. LAUNCHER STATE
   - Floating button at configured position (bottom-right or bottom-left)
   - Customized with settings.primaryColor and settings.launcherIcon
   - Unread badge if unreadCount > 0
   - Click → check business hours → if open, go to pre-chat or chat; if closed, go to offline

2. PRE-CHAT STATE (if settings.preChatEnabled)
   - Header with company logo + name + welcome message
   - Form fields based on settings:
     - Name (required if preChatNameRequired)
     - Email (required if preChatEmailRequired)
     - Phone (if preChatPhoneEnabled, required if preChatPhoneRequired)
     - Message (if preChatMessageRequired)
     - Department selector (if preChatDepartmentSelector && departments exist)
   - "Start Chat" button
   - Submit → call POST /api/modules/live-chat/conversations → go to CHAT state

3. CHAT STATE
   - Header: company name/logo + minimize button + close button
   - Online status: "We typically reply in X minutes" or "Away" or agent name/avatar
   - Messages area: scrollable, auto-scroll on new messages
   - Message bubbles: visitor (right, primary color), agent (left, gray), system (center, muted)
   - Typing indicator when agent is typing
   - Message input: textarea + send button + file upload button (if enabled)
   - Send → call POST /api/modules/live-chat/messages
   - Realtime: subscribe to Supabase channel for new messages
     - Use the anon key + channel subscription (no auth needed for Realtime on public tables)
     - OR use API polling as fallback (every 3 seconds)
   - Sound notification on new agent message (if enabled)

4. RATING STATE (after conversation resolved)
   - "How was your experience?"
   - 5-star rating selector
   - Optional comment textarea
   - Submit button
   - "Thanks for your feedback!" confirmation

5. OFFLINE STATE (outside business hours)
   - Show offlineMessage
   - Show a form: name, email, message
   - Submit → create conversation with status 'pending'
   - "We'll get back to you" confirmation

Styling:
- Uses settings.primaryColor for header, buttons, visitor message bubbles
- Uses settings.textColor for text on primary color
- Uses settings.borderRadius for rounded corners
- Responsive: full-screen on mobile (< 480px width)
- Smooth open/close animation (slide up/fade in)
- Widget width: ~380px, height: ~520px (desktop)
```

---

## Task 4: Widget Sub-Components

**File**: `next-platform-dashboard/src/modules/live-chat/components/widget/WidgetLauncher.tsx`
```
Floating action button:
- Positioned fixed based on settings.position
- Size based on settings.launcherSize
- Background color: settings.primaryColor
- Icon: Lucide icon based on settings.launcherIcon
- Unread badge (red dot with count)
- Click handler
- Hover animation (scale up slightly)
- Shadow for depth
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/widget/WidgetPreChatForm.tsx`
```
Pre-chat form component:
- Header with logo and welcome message
- Dynamic form fields based on settings
- Validation (required fields)
- Department selector dropdown
- Submit button with loading state
- Powered by DRAMAC link (optional)
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/widget/WidgetChat.tsx`
```
Main chat interface within widget:
- Message list with auto-scroll
- Message input area
- Typing indicator
- File upload handling
- Realtime subscription or API polling
- Agent info display
- Sound notification for new messages
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/widget/WidgetMessageBubble.tsx`
```
Message bubble for widget (simpler than agent dashboard version):
- Visitor messages: aligned right, primary color background
- Agent messages: aligned left, gray background, agent name/avatar
- System messages: centered, muted
- AI messages: same as agent but with subtle AI indicator
- File messages: image preview or file download link
- Timestamp below each message
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/widget/WidgetRating.tsx`
```
Satisfaction rating component:
- Star rating (1-5, clickable)
- Comment textarea
- Submit button
- Thank you state after submission
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/widget/WidgetOfflineForm.tsx`
```
Offline message form:
- Show offline message from settings
- Name, email, message fields
- Submit creates a conversation in pending state
- Confirmation message after submit
```

---

## Task 5: Settings Page

**File**: `next-platform-dashboard/src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/settings/page.tsx`

```
Server page:
1. Auth guard
2. Call getWidgetSettings(siteId)
3. Call getDepartments(siteId)
4. Pass to <SettingsPageWrapper />
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/wrappers/SettingsPageWrapper.tsx`

```
'use client' wrapper — Widget customization + integration settings

Tabbed interface:
TAB 1: Widget Appearance
  - Color picker for primary color and text color
  - Position selector (bottom-right / bottom-left)
  - Launcher icon selector (grid of Lucide icons)
  - Launcher size slider
  - Border radius slider
  - Logo uploader
  - Live preview panel (shows widget preview with current settings)

TAB 2: Branding & Messages
  - Company name input
  - Welcome message textarea
  - Away message textarea
  - Offline message textarea
  - Language selector
  - Custom translations editor (key-value pairs)

TAB 3: Pre-Chat Form
  - Toggle: Enable pre-chat form
  - Toggle: Name required
  - Toggle: Email required
  - Toggle: Phone enabled / required
  - Toggle: Initial message required
  - Toggle: Department selector

TAB 4: Business Hours
  - Toggle: Enable business hours
  - Timezone selector (default: Africa/Lusaka from locale-config)
  - Day-by-day schedule:
    - Each day: enabled toggle, start time, end time
    - Copy schedule to all days button
  - Preview: "Currently OPEN" or "Currently CLOSED — opens Monday at 9:00 AM"

TAB 5: Behavior
  - Auto-open delay (seconds, 0 = disabled)
  - Show agent avatar toggle
  - Show agent name toggle
  - Show typing indicator toggle
  - Enable file uploads toggle
  - Enable emoji toggle
  - Enable sound notifications toggle
  - Enable satisfaction rating toggle
  - Allowed file types checklist
  - Max file size slider

TAB 6: Embed Code
  - Show the embed code snippet:
    <script src="https://app.dramacagency.com/api/modules/live-chat/embed?siteId=XXX" async></script>
  - Copy to clipboard button
  - Instructions for common platforms (WordPress, Shopify, custom HTML)
  - Test button: opens preview in new tab

TAB 7: WhatsApp (shows setup prompt, full config in LC-05)
  - Basic WhatsApp toggle
  - Phone number input
  - Link to WhatsApp setup guide

TAB 8: Advanced
  - Allowed domains (list editor)
  - Blocked IPs (list editor)
  - Z-index input

Save button at bottom — calls updateWidgetSettings()
Toast on save success/failure
```

---

## Task 6: Notification Integration

**File**: Update notification types to include chat notifications.

Add to the platform's notification type system. The implementing AI should:

1. Add notification types to `src/lib/services/notifications.ts`:
   - `new_chat_message` — New message in a conversation assigned to agent
   - `chat_assigned` — Conversation assigned to agent
   - `chat_missed` — No agent responded within SLA
   - `chat_rating_received` — Customer left a rating

2. Add email types to `src/lib/email/email-types.ts`:
   - `chat_transcript` — Conversation transcript sent to customer
   - `chat_missed` — Missed chat notification to site owner

3. Add email templates to `src/lib/email/templates.ts` and `templates/branded-templates.ts`:
   - `chat_transcript`: Shows conversation history with timestamps
   - `chat_missed`: Alert with visitor info and link to conversation

4. Create notification helper in `src/modules/live-chat/lib/chat-notifications.ts`:
   ```typescript
   // notifyNewChatMessage(data: { siteId, conversationId, visitorName, messagePreview, agentUserId })
   //   → createNotification + optional email
   
   // notifyChatAssigned(data: { siteId, conversationId, visitorName, agentUserId })
   //   → createNotification
   
   // notifyChatMissed(data: { siteId, conversationId, visitorName, visitorEmail })
   //   → createNotification to site owner + sendBrandedEmail
   
   // notifyChatRating(data: { siteId, conversationId, visitorName, rating, comment, agentUserId })
   //   → createNotification
   
   // sendTranscriptEmail(data: { recipientEmail, recipientName, conversationId, messages: ChatMessage[] })
   //   → sendBrandedEmail with formatted conversation history
   ```

---

## Task 7: Widget Embed on Published Sites (Platform Integration)

When a site has live-chat enabled, the widget should automatically appear on their published site.

**Approach**: Modify the published site rendering to include the widget embed script.

The implementing AI should check how published sites render (in `src/app/site/[domain]/`) and add the widget script tag when the live-chat module is enabled for that site.

Specifically:
1. In the site layout or page, check `isModuleEnabledForSite(siteId, 'live-chat')`
2. If enabled, inject: `<script src="/api/modules/live-chat/embed?siteId=${siteId}" async></script>`
3. This makes the widget automatically appear on all published DRAMAC sites without manual embed

For external sites (non-DRAMAC), the user copies the embed code from the settings page.

---

## Verification Checklist

1. [ ] Widget API routes work without authentication (anonymous access)
2. [ ] Widget renders at /chat-widget?siteId=xxx
3. [ ] Widget launcher appears with correct styling from settings
4. [ ] Pre-chat form collects visitor info and creates conversation
5. [ ] Messages send and receive in real-time
6. [ ] Agent typing indicator shows in widget
7. [ ] Satisfaction rating works after conversation resolved
8. [ ] Offline form works when outside business hours
9. [ ] Business hours calculation is correct for Africa/Lusaka timezone
10. [ ] Settings page saves all configuration correctly
11. [ ] Live preview in settings updates with changes
12. [ ] Embed code copies correctly
13. [ ] Widget auto-loads on published DRAMAC sites when module enabled
14. [ ] Sound notification plays on new message
15. [ ] File upload works in widget
16. [ ] Widget is responsive on mobile
17. [ ] Notification types added to platform notification system
18. [ ] Email templates for chat_transcript and chat_missed
19. [ ] `npx tsc --noEmit` passes with zero errors

### Testing Instructions
1. Go to Settings, configure widget appearance and save
2. Copy embed code and add to a test HTML page
3. Open the test page — widget launcher should appear
4. Click launcher → pre-chat form → fill in details → start chat
5. In dashboard, verify conversation appears in conversation list
6. Reply from dashboard → message should appear in widget
7. Type in dashboard → typing indicator should show in widget
8. Resolve conversation → rating prompt should appear in widget
9. Submit rating → verify it's stored on the conversation
10. Set business hours → verify offline form shows outside hours
11. Test on published DRAMAC site — widget should auto-load
12. Commit: `git add -A && git commit -m "feat(live-chat): PHASE-LC-04: embeddable chat widget & settings page" && git push`
