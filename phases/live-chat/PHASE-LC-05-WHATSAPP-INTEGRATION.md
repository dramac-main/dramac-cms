# PHASE LC-05: WhatsApp Business Integration

**Phase**: LC-05  
**Module**: Live Chat & Omnichannel Messaging  
**Goal**: Integrate WhatsApp Business Cloud API for sending/receiving WhatsApp messages through the same agent dashboard, with webhook processing, template messages, and 24-hour service window management  
**Independence**: Requires LC-01 (types + DB) and LC-02 (actions)  
**Estimated Files**: ~10 files  
**Prerequisites**: LC-01, LC-02 complete. WhatsApp Business Account required for testing

---

## CRITICAL RULES

1. Read `/memory-bank/systemPatterns.md` for ALL platform patterns before starting
2. WhatsApp Cloud API is the OFFICIAL Meta API — do NOT use third-party services
3. All WhatsApp API calls go through a server-side service (never expose tokens to client)
4. Webhook signature verification is MANDATORY for security
5. 24-hour customer service window: free replies within 24h of last customer message; outside window, must use template messages (paid)
6. WhatsApp types are already defined in LC-01 types file
7. Widget settings table already has WhatsApp fields (whatsapp_enabled, whatsapp_phone_number, etc.)
8. ZERO mock data
9. Run `npx tsc --noEmit` at the end — zero errors

---

## WhatsApp Cloud API Overview

### How It Works
1. **Business Account**: Agency creates a WhatsApp Business Account on Meta Business Suite
2. **Phone Number**: Registers a phone number for messaging
3. **System User**: Creates a System User with a permanent access token
4. **Webhook**: DRAMAC receives incoming messages via webhook at `/api/modules/live-chat/webhooks/whatsapp`
5. **Send**: DRAMAC sends messages via WhatsApp Cloud API (`POST graph.facebook.com/v21.0/{phone_number_id}/messages`)
6. **Templates**: Pre-approved message templates for outbound messaging outside 24h window

### 24-Hour Service Window
- When a customer sends a message, a 24-hour window opens
- Within 24h: Business can send any text, image, document, etc. (free)
- After 24h: Business must use pre-approved template messages (per-message pricing)
- Window tracked via `whatsapp_window_expires_at` on conversation

### Environment Variables (from LC-00 Master Plan)
```env
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
```

---

## Task 1: WhatsApp API Service

**File**: `next-platform-dashboard/src/modules/live-chat/lib/whatsapp-service.ts`

```typescript
// WhatsApp Cloud API Service
// Server-side only — NEVER import this on the client

// Configuration
// const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0'
// Read env vars: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, etc.
// isWhatsAppConfigured(): boolean — checks if all required env vars are set

// 1. sendTextMessage(to: string, text: string, phoneNumberId?: string, accessToken?: string)
//    - POST to /{phone_number_id}/messages
//    - Body: { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }
//    - Returns { messageId: string, error: string | null }
//    - Support per-site credentials (phoneNumberId, accessToken from widget settings)
//    - Fallback to global env vars if not provided

// 2. sendImageMessage(to: string, imageUrl: string, caption?: string, phoneNumberId?, accessToken?)
//    - type: 'image', image: { link: imageUrl, caption }
//    - Returns { messageId, error }

// 3. sendDocumentMessage(to: string, documentUrl: string, filename: string, caption?: string, phoneNumberId?, accessToken?)
//    - type: 'document', document: { link: documentUrl, filename, caption }
//    - Returns { messageId, error }

// 4. sendTemplateMessage(to: string, template: WhatsAppTemplateMessage, phoneNumberId?, accessToken?)
//    - type: 'template', template: { name, language, components }
//    - Used for outbound messages outside 24h window
//    - Returns { messageId, error }

// 5. sendReaction(to: string, messageId: string, emoji: string, phoneNumberId?, accessToken?)
//    - type: 'reaction', reaction: { message_id: messageId, emoji }

// 6. markAsRead(messageId: string, phoneNumberId?, accessToken?)
//    - POST to /{phone_number_id}/messages
//    - Body: { messaging_product: 'whatsapp', status: 'read', message_id: messageId }

// 7. getMediaUrl(mediaId: string, accessToken?)
//    - GET /{mediaId} — returns the URL for downloading WhatsApp media
//    - Download the media and re-upload to Supabase Storage for permanent storage

// 8. verifyWebhookSignature(rawBody: string, signature: string): boolean
//    - HMAC SHA256 verification using WHATSAPP_APP_SECRET
//    - signature comes from x-hub-signature-256 header

// Helper: getPerSiteCredentials(siteId: string)
//    - Query mod_chat_widget_settings for the site
//    - Return { phoneNumberId, accessToken } if configured per-site
//    - Fallback to env vars if not set per-site
```

---

## Task 2: WhatsApp Webhook Route

**File**: `next-platform-dashboard/src/app/api/modules/live-chat/webhooks/whatsapp/route.ts`

```typescript
// GET handler — Webhook verification (Meta sends this when you register the webhook URL)
// Params: hub.mode, hub.verify_token, hub.challenge
// If mode === 'subscribe' && verify_token matches WHATSAPP_VERIFY_TOKEN:
//   Return hub.challenge as plain text with 200
// Else: Return 403

// POST handler — Incoming message/status webhook
// 1. Read raw body for signature verification
// 2. Verify signature with verifyWebhookSignature()
// 3. Parse body as WhatsAppWebhookPayload
// 4. Process each entry.changes:
//    a. If messages exist: processIncomingMessage(message, metadata, contacts)
//    b. If statuses exist: processMessageStatus(status)
// 5. Return 200 immediately (webhook must respond fast)

// processIncomingMessage(message, metadata, contacts):
//   1. Find or create visitor by WhatsApp phone number (message.from)
//      - Lookup in mod_chat_visitors WHERE whatsapp_phone = message.from AND site matches
//      - If not found, create new visitor with name from contacts[0].profile.name
//   2. Find or create conversation
//      - Lookup active/pending conversation for this visitor (channel = 'whatsapp')
//      - If not found, create new with channel 'whatsapp', status 'pending'
//      - Set whatsapp_window_expires_at = now + 24 hours
//   3. If found, extend window: whatsapp_window_expires_at = now + 24 hours
//   4. Insert message into mod_chat_messages
//      - sender_type: 'visitor'
//      - content: depends on message.type
//        - text → message.text.body
//        - image → download media, upload to Supabase Storage, save file_url
//        - document → download, upload, save file fields
//        - audio/video → download, upload, save file fields
//        - location → JSON encode lat/lng/name/address as content
//      - whatsapp_message_id: message.id
//      - content_type: map WhatsApp type to our content_type
//   5. Mark as read (call markAsRead)
//   6. Auto-assign if configured
//   7. Send notification to assigned agent or all online agents

// IMPORTANT: Determine which site this message belongs to
// - Match metadata.phone_number_id to mod_chat_widget_settings.whatsapp_phone_number_id
// - This tells us which site the message is for
// - If no match, log error and return 200 (don't retry)

// processMessageStatus(status):
//   1. Find message by whatsapp_message_id
//   2. Update message status (sent/delivered/read/failed)
//   3. If failed, update with error details
```

---

## Task 3: WhatsApp Server Actions

**File**: `next-platform-dashboard/src/modules/live-chat/actions/whatsapp-actions.ts`

```typescript
'use server'

// 1. sendWhatsAppMessage(conversationId: string, content: string, senderName: string, senderId: string)
//    - Get conversation to find visitor's WhatsApp phone and site credentials
//    - Check 24h window: if whatsapp_window_expires_at is in the future, send directly
//    - If window expired, return error: "24-hour window expired. Use template message."
//    - Call whatsappService.sendTextMessage(phone, content)
//    - Insert message into mod_chat_messages with sender_type 'agent', whatsapp_message_id from response
//    - Return { message, error }

// 2. sendWhatsAppImage(conversationId: string, imageUrl: string, caption: string, senderName: string, senderId: string)
//    - Same window check
//    - Call whatsappService.sendImageMessage
//    - Insert message record
//    - Return { message, error }

// 3. sendWhatsAppDocument(conversationId: string, documentUrl: string, filename: string, senderName: string, senderId: string)
//    - Same pattern
//    - Return { message, error }

// 4. sendWhatsAppTemplate(conversationId: string, template: WhatsAppTemplateMessage, senderId: string)
//    - Used when 24h window has expired
//    - Call whatsappService.sendTemplateMessage
//    - Insert message with content_type 'whatsapp_template'
//    - Return { message, error }

// 5. getWhatsAppStatus(siteId: string)
//    - Check if WhatsApp is configured (env vars or per-site settings)
//    - Return { configured: boolean, phoneNumber: string | null, error: string | null }

// 6. saveWhatsAppSettings(siteId: string, data: { phoneNumber, phoneNumberId, businessAccountId, accessToken?, welcomeTemplate? })
//    - Update mod_chat_widget_settings WhatsApp fields
//    - Validate by making a test API call (get phone number details)
//    - Return { success, error }

// 7. getWhatsAppTemplates(siteId: string)
//    - Fetch available message templates from WhatsApp Business API
//    - GET /{businessAccountId}/message_templates
//    - Return { templates: Array<{ name, language, status, components }>, error }
```

---

## Task 4: WhatsApp Settings Component

**File**: `next-platform-dashboard/src/modules/live-chat/components/settings/WhatsAppSetup.tsx`

```
'use client' component for WhatsApp configuration in the Settings page.

Layout:
1. Status indicator: Connected / Not configured
2. If not configured:
   - Step-by-step setup guide:
     Step 1: Create a Meta Business Account
     Step 2: Create a WhatsApp Business Account
     Step 3: Add a phone number
     Step 4: Create a System User and generate access token
     Step 5: Enter credentials below
   - Input fields:
     - WhatsApp Phone Number (display format, e.g., +260 97 1234567)
     - Phone Number ID (from Meta dashboard)
     - Business Account ID
     - Access Token (masked input, save to env or widget settings)
     - Webhook Verify Token (auto-generated, show webhook URL to register)
   - "Test Connection" button → calls getWhatsAppStatus
   - "Save" button → calls saveWhatsAppSettings

3. If configured:
   - Connected status with green indicator
   - Phone number display
   - Webhook URL to register: https://app.dramacagency.com/api/modules/live-chat/webhooks/whatsapp
   - Welcome template selector
   - Message templates list (fetched from WhatsApp API)
   - Test message button (send a test message to a number)
   - Disconnect button

4. Info section:
   - 24-hour window explanation
   - Template message pricing info
   - Link to WhatsApp Business API documentation
```

---

## Task 5: WhatsApp Conversation UI Enhancements

Enhance the existing conversation view (from LC-03) to handle WhatsApp-specific features:

**Updates to ConversationViewWrapper** (or create a WhatsApp-aware version):

```
When conversation.channel === 'whatsapp':
1. Show WhatsApp icon in header
2. Show 24-hour window status:
   - If window active: "Service window open — expires in X hours"  
   - If window expired: "Service window closed — use template message"
3. Template message button (visible when window expired)
   - Opens template selector dialog
   - User picks template, fills parameters, sends
4. Show WhatsApp message statuses: sent (single check), delivered (double check), read (blue double check)
5. Show visitor's WhatsApp phone number in header
6. Send button behavior:
   - If window open: send as normal text
   - If window closed: prompt to use template or warn that message will fail
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/WhatsAppWindowIndicator.tsx`
```
Component showing 24h window status:
- Countdown timer if window is active
- "Window expired" warning if expired
- "Template required" badge when expired
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/TemplateMessageDialog.tsx`
```
Dialog for sending WhatsApp template messages:
- List of available templates (from WhatsApp API)
- Template preview
- Parameter input fields
- Language selector
- Send button
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/shared/WhatsAppStatusIndicator.tsx`
```
Message delivery status indicators:
- sending: clock icon
- sent: single check (gray)
- delivered: double check (gray)
- read: double check (blue)
- failed: red X with error tooltip
```

---

## Task 6: CRM Integration for WhatsApp Contacts

When a WhatsApp conversation starts, optionally create or link a CRM contact:

**File**: `next-platform-dashboard/src/modules/live-chat/lib/crm-integration.ts`

```typescript
// Server-side helper (NOT 'use server' — it's a utility called by server actions)

// 1. findOrCreateCrmContact(siteId: string, visitor: ChatVisitor)
//    - Import CRM actions or query crm_contacts directly
//    - Search by email or phone
//    - If found, link: update visitor.crm_contact_id
//    - If not found, create new CRM contact with visitor data
//    - Log CRM activity: type 'chat', description "WhatsApp conversation started"
//    - Return { contactId, isNew, error }

// 2. logChatActivity(siteId: string, contactId: string, conversationId: string, summary: string)
//    - Insert into crm_activities: type 'chat', related_entity 'conversation', entity_id = conversationId
//    - Description includes summary of conversation
```

---

## Task 7: WhatsApp Media Handling

**File**: `next-platform-dashboard/src/modules/live-chat/lib/whatsapp-media.ts`

```typescript
// Server-side utility for handling WhatsApp media

// 1. downloadWhatsAppMedia(mediaId: string, accessToken: string): Promise<Buffer>
//    - GET https://graph.facebook.com/v21.0/{mediaId}  → returns { url }
//    - GET {url} with Authorization header → returns binary data
//    - Return the buffer

// 2. uploadToSupabaseStorage(buffer: Buffer, filename: string, mimeType: string, siteId: string): Promise<string>
//    - Upload to Supabase Storage bucket 'chat-media' (or 'social-media' bucket)
//    - Path: `chat/${siteId}/${uuid}_${filename}`
//    - Return the public URL

// 3. processWhatsAppMediaMessage(message: WhatsAppIncomingMessage, siteId: string, accessToken: string)
//    - Based on message.type (image/document/audio/video):
//      - Get mediaId from message[type].id
//      - Download media
//      - Upload to Supabase Storage
//      - Return { fileUrl, fileName, fileSize, fileMimeType }
```

---

## Verification Checklist

1. [ ] WhatsApp service makes real API calls to Meta Cloud API
2. [ ] Webhook verification (GET) works — Meta can verify the endpoint
3. [ ] Incoming messages are processed and stored correctly
4. [ ] Message status updates (sent/delivered/read) work
5. [ ] 24-hour service window is tracked and enforced
6. [ ] Template messages can be sent when window expired
7. [ ] Media messages (images, documents) are downloaded and stored
8. [ ] WhatsApp settings page allows full configuration
9. [ ] Connection test validates credentials
10. [ ] WhatsApp conversations appear in the agent dashboard
11. [ ] WhatsApp status indicators show in message bubbles
12. [ ] CRM integration creates/links contacts
13. [ ] Webhook signature verification prevents unauthorized access
14. [ ] Per-site WhatsApp credentials work (different phone per site)
15. [ ] `npx tsc --noEmit` passes with zero errors

### Testing Instructions
1. Set up a WhatsApp Business test account (Meta provides sandbox for testing)
2. Configure env vars: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN, etc.
3. Register webhook URL with Meta: https://your-domain.com/api/modules/live-chat/webhooks/whatsapp
4. Send a message from WhatsApp to the business number
5. Verify message appears in agent dashboard under WhatsApp tab
6. Reply from dashboard → verify message appears in WhatsApp
7. Wait 24 hours → verify template message requirement is enforced
8. Send an image from WhatsApp → verify it's downloaded and displayed
9. Check CRM → verify contact was created
10. Commit: `git add -A && git commit -m "feat(live-chat): PHASE-LC-05: WhatsApp Business Cloud API integration" && git push`

### Important Notes
- WhatsApp Business API requires Meta business verification for production use
- Test with Meta's sandbox environment first
- Per-conversation pricing applies for business-initiated messages
- Template messages must be approved by Meta before use (24-72 hour review)
- GDPR/privacy: inform users that messages are stored and processed
