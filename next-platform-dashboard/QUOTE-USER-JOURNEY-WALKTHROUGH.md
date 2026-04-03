# Quote Request — Complete User Journey Walkthrough

> Every step a customer and store owner goes through when requesting, processing, and responding to a quote on a DRAMAC-powered storefront.

---

## Overview

The quote system allows storefront visitors to request custom pricing instead of buying at listed prices. The store operates in **Quotation Mode** (enabled per-store in ecommerce settings), which replaces "Add to Cart" with "Add to Quote" across all product cards.

**Key files referenced:**
- Storefront form: `src/modules/ecommerce/studio/components/QuoteRequestBlock.tsx`
- Hook: `src/modules/ecommerce/hooks/useQuotations.ts`
- Server actions (create): `src/modules/ecommerce/actions/quote-actions.ts`
- Server actions (workflow): `src/modules/ecommerce/actions/quote-workflow-actions.ts`
- Business notifications: `src/lib/services/business-notifications.ts`
- Chat event bridge: `src/modules/live-chat/lib/chat-event-bridge.ts`
- Chat embed script: `src/app/api/modules/live-chat/embed/route.ts`
- Chat widget: `src/modules/live-chat/components/widget/ChatWidget.tsx`
- AI responder: `src/modules/live-chat/lib/ai-responder.ts`
- Quote portal page: `src/app/quote/[token]/page.tsx`
- Portal auth: `src/modules/ecommerce/actions/quote-portal-auth.ts`
- Email gate UI: `src/modules/ecommerce/components/portal/quote-email-gate.tsx`
- Portal view: `src/modules/ecommerce/components/portal/quote-portal-view.tsx`
- Accept form: `src/modules/ecommerce/components/portal/quote-accept-form.tsx`
- Reject dialog: `src/modules/ecommerce/components/portal/quote-reject-dialog.tsx`
- Amendment dialog: `src/modules/ecommerce/components/portal/quote-amendment-dialog.tsx`
- Dashboard quotes view: `src/modules/ecommerce/components/views/quotes-view.tsx`
- Dashboard quote builder: `src/modules/ecommerce/components/quotes/quote-builder-dialog.tsx`
- Dashboard send dialog: `src/modules/ecommerce/components/quotes/send-quote-dialog.tsx`
- Live chat quote panel: `src/modules/live-chat/components/shared/ChatQuotePanel.tsx`

---

## PHASE 1: Customer Builds a Quote (Storefront)

### Step 1 — Customer Browses Products

**What the customer sees:** A storefront product catalog with "Add to Quote" buttons instead of "Add to Cart" (because **quotation mode** is enabled in store settings).

**What happens in code:**
- The `useStorefront()` context exposes `quotationModeEnabled: true`.
- Product cards check this flag and render "Add to Quote" buttons.
- Clicking "Add to Quote" adds the product to the cart store (the cart doubles as a quote builder in quotation mode).

**Files:** Product card components + `storefront-context.tsx` + `useStorefrontCart.ts`

---

### Step 2 — Customer Navigates to Quote Request Page

**What the customer sees:** A page with the quote request form, showing all selected items with quantities and a contact information form.

**What happens in code:**
- The storefront has a page containing the `QuoteRequestBlock` component (registered as `EcommerceQuoteRequest` in the studio).
- On mount, `QuoteRequestBlock` reads cart items via `useStorefrontCart()` and auto-populates the `builderItems` array from them.
- Each item shows: product image, name, quantity selector, and list price (for reference).

**File:** `QuoteRequestBlock.tsx` lines 143–166 (cart → builder auto-population)

---

### Step 3 — Customer Fills in Contact Details

**What the customer sees:** A form with fields:
- **Name** (required)
- **Email** (required)
- **Phone** (optional, can be made required)
- **Company** (optional, can be made required)
- **Notes** (optional free text)

**What happens in code:**
- Form state is managed by `useState<QuoteRequestData>`.
- Client-side validation checks required fields and email format.
- Validation errors appear inline below each field.

**File:** `QuoteRequestBlock.tsx` lines 215–275 (validation + form rendering)

---

### Step 4 — Customer Submits the Quote

**What the customer sees:** A loading spinner on the "Submit Quote Request" button.

**What happens in code (sequential):**
1. `handleSubmit()` validates form data and items.
2. Calls `submitQuoteRequest(formData)` from the `useQuotations` hook.
3. The hook calls `createQuoteAction()` which:
   - **Creates the quote** via `createQuote()` server action → inserts into `mod_ecommod01_quotes` table with status `"pending"` and generates a unique `quote_number` (e.g., `QUO-1234`).
   - **Generates an access token** (UUID without dashes) stored on the quote.
   - **Adds each item** via `addQuoteItem()` → inserts into `mod_ecommod01_quote_items`. Prices converted from cents to main currency (÷100).
   - **Recalculates totals** via `recalculateQuoteTotals()`.
   - **Sends notifications** via `notifyQuoteCreated()` (see Step 5).
4. Cart is cleared after successful submission.

**Files:**
- `QuoteRequestBlock.tsx` lines 253–318 (form submit handler)
- `useQuotations.ts` lines 100–165 (createQuoteAction)
- `quote-actions.ts` lines 1169–1230 (notifyQuoteCreated)

---

## PHASE 2: Notifications Fire (Automatic)

### Step 5 — Notifications Sent to Both Parties

**5a. Store Owner Receives:**

1. **In-app notification** — Bell icon badge in dashboard with "New Quote Request #QUO-1234" and link to quotes dashboard.
2. **Email** — Branded email (via Resend) with:
   - Customer name, email, phone, company
   - Quote number
   - Item count and total
   - "View in Dashboard" link
   - Items list with names, quantities, and unit prices

**5b. Customer Receives:**

1. **Email** — Branded confirmation email with:
   - "Your quote request has been received"
   - Quote number
   - Item count
   - Business name
   - Items list
   - "Track Your Quote" link (portal URL with access token)

**What happens in code:**
- `notifyQuoteCreated()` in `quote-actions.ts` fetches the full quote + items, then calls `notifyNewQuote()` in `business-notifications.ts`.
- `notifyNewQuote()`:
  1. Resolves site → agency → owner profile chain.
  2. Creates in-app notification via `createNotification()`.
  3. Sends owner email via `sendBrandedEmail()` (type: `quote_request_owner`).
  4. Sends customer email via `sendBrandedEmail()` (type: `quote_request_customer`).
  5. All three run in parallel where possible.
- Also calls `notifyChatQuoteRequested()` (best-effort, see Step 6).

**Files:**
- `quote-actions.ts` lines 1169–1230 (orchestrator)
- `business-notifications.ts` lines 1106–1230 (notifyNewQuote — in-app + 2 emails)

---

### Step 6 — Chat Notification (Quote Submitted)

**What appears in the customer's chat:** A message from Chiko (the AI assistant): _"Quote QUO-1234 received! ✅ Our team will review your 3 items and email you when it's ready."_

**What happens in code:**
- `notifyChatQuoteRequested()` in `chat-event-bridge.ts` finds the active chat conversation for this customer email.
- Sends a proactive message via `sendProactiveMessage()` using the store's AI assistant name.

**File:** `chat-event-bridge.ts` lines 238–258

---

## PHASE 3: Customer Sees Success Screen

### Step 7 — Success Confirmation Page

**What the customer sees:**
- Large green checkmark icon
- "Quote Request Submitted!" heading
- "We've received your request and will send your quote to **customer@email.com** shortly."
- Reference number: **QUO-1234**
- "What happens next" box:
  1. Our team reviews your request
  2. We prepare a detailed quote with pricing
  3. You'll receive an email when it's ready
  4. Accept, request changes, or decline — all online
- Three action buttons:
  - **Track Your Quote** → Opens portal URL in new tab
  - **Download Quote Summary** → Generates PDF via `downloadQuotePDF()`
  - **Chat With Us** → Opens live chat widget

**File:** `QuoteRequestBlock.tsx` lines 346–430 (success render)

---

### Step 8 — Chat Auto-Opens (2-Second Delay)

**What the customer sees:** The live chat widget automatically opens ~2 seconds after the success screen appears.

**What happens in code:**
1. A `useEffect` triggers when `isSubmitted` becomes true.
2. After a 2-second timeout, `window.postMessage()` sends `{ type: "dramac-chat-open", quoteContext: { quoteNumber, itemCount, email } }`.
3. The embed script (`route.ts`) captures this message:
   - **First:** Forwards `quoteContext` to the iframe via `postMessage({ type: "dramac-chat-quote-context", quoteContext })`.
   - **Then:** Opens the chat widget (triggers `toggleChat()`).
4. Inside the iframe, `ChatWidget.tsx` receives the quote context and stores it.
5. When `handleOpen()` fires, it finds the pending quote context and:
   - Looks for an existing conversation with this quote number (per-quote isolation).
   - If none exists, creates a new conversation with quote metadata (`quote_number`, `quote_guidance_active: true`).
   - Tags the conversation with the quote number.

**Files:**
- `QuoteRequestBlock.tsx` lines 326–343 (auto-open effect)
- `embed/route.ts` lines 229–250 (message forwarding)
- `ChatWidget.tsx` (quote context handling + per-quote conversation creation)

---

### Step 9 — AI Greeting in Chat

**What the customer sees:** Chiko (AI assistant) immediately responds with a contextual greeting acknowledging the quote request.

**What happens in code:**
- The conversation is created with metadata `{ quote_number: "QUO-1234", quote_guidance_active: true }`.
- When the AI responder builds the system prompt, it:
  1. Extracts `targetQuoteNumber` from `convMeta.quote_number`.
  2. Extracts `quoteGuidanceActive` from `convMeta.quote_guidance_active`.
  3. Queries `mod_ecommod01_quotes` for quotes matching this site (includes `"pending"` and `"draft"` statuses).
  4. Adds a special section to the prompt: **"THIS CONVERSATION IS ABOUT QUOTE: QUO-1234"**.
  5. Includes **QUOTATION GUIDANCE** instructions (1-2 sentence responses, confident tone).
  6. Sets confidence to **0.9** so Chiko responds authoritatively instead of suggesting handoff.
  7. Explicit instruction: "NEVER say you don't have visibility into quotes."

**File:** `ai-responder.ts` (quote metadata extraction + system prompt construction)

---

## PHASE 4: Store Owner Processes the Quote (Dashboard)

### Step 10 — Store Owner Opens Dashboard Notification

**What the store owner sees:**
- Bell icon shows notification badge.
- Notification: "New Quote Request #QUO-1234 — [Customer Name] requested a quote for 3 items (ZMW 28,000)".
- Clicking it navigates to the Quotes section of the ecommerce dashboard.

**What happens in code:**
- In-app notification was created by `notifyNewQuote()` with `link: /dashboard/sites/{siteId}/ecommerce?view=quotes`.

**File:** `business-notifications.ts` lines 1155–1170

---

### Step 11 — Store Owner Views Quote Details

**What the store owner sees:**
- Quotes table showing all quotes with status badges (Pending, Sent, Accepted, etc.).
- Clicking a quote opens the detail dialog showing:
  - Customer info (name, email, phone, company)
  - Quote items with names, quantities, unit prices, line totals
  - Subtotal, tax, shipping, and total
  - Timeline of activities (created, sent, viewed, etc.)
  - Status badge and expiry date

**Files:**
- `quotes-view.tsx` (table + filters)
- `quote-detail-dialog.tsx` (detail view)
- `quote-table.tsx` (table columns + actions)

---

### Step 12 — Store Owner Edits the Quote

**What the store owner sees:**
- "Edit" button opens the Quote Builder dialog.
- Can add/remove items, change quantities, adjust unit prices.
- Can set title, expiry date, custom notes to customer.
- Can set custom discount and tax.
- Live total calculation updates as items change.

**What happens in code:**
- `QuoteBuilderDialog` manages all quote items, prices, and metadata.
- On save, updates `mod_ecommod01_quotes` and `mod_ecommod01_quote_items` tables.
- Recalculates totals.

**File:** `quote-builder-dialog.tsx`

**Alternative: Edit from Live Chat**
- The store owner can also edit quotes directly from the live chat admin panel.
- `ChatQuotePanel` component shows quote details and allows status changes.
- When setting status to "sent", it calls `sendQuote()` directly.

**File:** `ChatQuotePanel.tsx` (live chat quote panel)

---

### Step 13 — Store Owner Sends the Quote

**What the store owner sees:**
- "Send Quote" button opens a dialog with:
  - Subject line (pre-filled: "Your Quote QUO-1234 is Ready")
  - Personal message field
  - CC email addresses (optional)
- Clicks "Send" to email the quote to the customer.

**What happens in code:**
1. `sendQuote()` server action:
   - Validates the quote is in `"draft"` or `"pending_approval"` status.
   - Generates an `access_token` (UUID) if one doesn't exist.
   - Updates status to `"sent"`, records `sent_at` timestamp.
   - Logs activity: "Quote sent to customer@email.com".
   - **Sends branded email** to customer via `sendBrandedEmail()` (type: `quote_sent_customer`) with:
     - Customer name, quote number
     - Custom subject and message from the store owner
     - Total amount (formatted)
     - Expiry date
     - "View Your Quote" button → portal URL
     - Business name
   - **Notifies chat** via `notifyChatQuoteSent()` (best-effort).

**Files:**
- `send-quote-dialog.tsx` (dialog UI)
- `quote-workflow-actions.ts` lines 104–235 (sendQuote action)

---

## PHASE 5: Customer Receives and Reviews the Quote

### Step 14 — Customer Receives Quote Email

**What the customer sees in their inbox:**
- Branded email from the store with subject (e.g., "Your Quote QUO-1234 is Ready").
- Quote number, total amount, expiry date.
- Custom message from the store owner.
- Prominent "View Your Quote" button linking to the portal.

**What happens in code:**
- `sendBrandedEmail()` renders the `quote_sent_customer` template with the store's branding (logo, colors) and the quote data.

**File:** `quote-workflow-actions.ts` lines 195–225 (email composition)

---

### Step 15 — Chat Notification (Quote Sent)

**What appears in the customer's chat:** _"Your quote QUO-1234 is ready (ZMW 28,000)! 🎉 Check your email to review and respond."_

(Portal URL is included if available.)

**File:** `chat-event-bridge.ts` lines 260–282

---

### Step 16 — Customer Clicks "View Your Quote" Link

**What the customer sees:** The browser navigates to `https://app.dramacagency.com/quote/{accessToken}`.

**What happens in code:**
- The `quote/[token]/page.tsx` server component:
  1. Fetches the quote by access token via `getQuoteByToken(token)`.
  2. If quote not found → 404 page.
  3. Checks email verification cookie via `verifyQuoteAccessCookie(token, quote.customer_email)`.
  4. If NOT verified → shows the email verification gate (Step 17).
  5. If verified → records a view and shows the full portal (Step 18).

**File:** `quote/[token]/page.tsx` (entire file)

---

### Step 17 — Email Verification Gate (Security)

**What the customer sees:**
- A centered card with a shield icon.
- "Verify Your Identity" heading.
- "Enter the email address associated with quote **QUO-1234** to view the details."
- Email input field.
- "Verify & View Quote" button.
- "Your access will be remembered for 7 days."

**What happens on submit:**
1. Customer enters their email address.
2. Server action `verifyQuoteAccess(token, email)`:
   - Fetches the quote by access token.
   - Compares the entered email with `quote.customer_email` (case-insensitive).
   - If mismatch → returns error: "The email address doesn't match our records."
   - If match → generates an **HMAC-SHA256 signed cookie**:
     - Cookie name: `qa_{first 12 chars of token}`
     - Cookie value: `HMAC-SHA256(token:email, secret)`
     - Secret: `QUOTE_ACCESS_SECRET` env var (fallback: `NEXTAUTH_SECRET`)
     - Flags: HttpOnly, Secure (production), SameSite=Lax, 7-day maxAge
   - Returns success + hashed email.
3. Page reloads → cookie is now set → verification passes → portal shown.

**Security details:**
- HMAC uses the native Node.js `crypto` module.
- Cookie verification uses `timingSafeEqual()` to prevent timing attacks.
- Only the specific email + token combination is valid.

**Files:**
- `quote-email-gate.tsx` (UI component)
- `quote-portal-auth.ts` (server actions: `verifyQuoteAccess`, `verifyQuoteAccessCookie`, `requireQuoteAccess`)

---

### Step 18 — Customer Views the Quote Portal

**What the customer sees:**
- Full quote details on a clean, light-themed page:
  - Quote number and title
  - Status badge (e.g., "Sent")
  - Expiry countdown (e.g., "Expires in 14 days")
  - All items with images, names, quantities, unit prices, line totals
  - Subtotal, tax, shipping, total
  - Notes from the store owner
  - Three action buttons:
    - ✅ **Accept Quote** (green)
    - 📝 **Request Changes** (outline)
    - ❌ **Decline Quote** (red outline)

**What happens in code:**
- `recordQuoteView(token)` updates the quote status from `"sent"` to `"viewed"` and records `viewed_at` timestamp + logs activity.
- `QuotePortalView` renders the full quote details with action buttons.
- Actions are disabled if quote is expired.

**Files:**
- `quote-portal-view.tsx` (main portal layout)
- `quote-workflow-actions.ts` line `recordQuoteView` function

---

## PHASE 6: Customer Responds to the Quote

### Step 19a — Customer ACCEPTS the Quote

**What the customer sees:**
- Accept dialog with:
  - Name field (required)
  - Email field (pre-filled and locked with green "✓ Verified" badge)
  - Digital signature pad (optional, canvas-based)
  - Terms checkbox
  - "Accept Quote" button

**What happens on submit:**
1. `acceptQuote()` server action:
   - **Verifies email gate cookie** via `requireQuoteAccess(token)` → returns error if not verified.
   - Fetches quote by access token.
   - Validates status is `"sent"` or `"viewed"`.
   - Checks expiry date.
   - Updates quote: status → `"accepted"`, records `responded_at`, stores signature data + acceptor name in metadata.
   - Logs activity.
   - **Sends notifications:**
     - `notifyQuoteAccepted()` → in-app notification + email to owner + email to customer.
     - `notifyChatQuoteAccepted()` → chat message: _"Quote QUO-1234 accepted (ZMW 28,000)! ✅ The store will process your order shortly."_

**Files:**
- `quote-accept-form.tsx` (UI with signature pad)
- `quote-workflow-actions.ts` lines 494–605 (acceptQuote action)
- `business-notifications.ts` `notifyQuoteAccepted()` function
- `chat-event-bridge.ts` lines 284–304

---

### Step 19b — Customer REJECTS the Quote

**What the customer sees:**
- Reject dialog with:
  - Optional reason text area
  - "Decline Quote" button

**What happens on submit:**
1. `rejectQuote()` server action:
   - **Verifies email gate cookie** via `requireQuoteAccess(token)`.
   - Fetches quote by access token.
   - Validates status is `"sent"` or `"viewed"`.
   - Updates quote: status → `"rejected"`, records `responded_at` and reason.
   - Logs activity.
   - **Sends notifications:**
     - `notifyQuoteRejected()` → in-app notification + email to owner.
     - `notifyChatQuoteRejected()` → chat message: _"Quote QUO-1234 declined. [Reason]. Let me know if you'd like a revised quote."_

**Files:**
- `quote-reject-dialog.tsx` (UI)
- `quote-workflow-actions.ts` lines 607–720 (rejectQuote action)
- `business-notifications.ts` `notifyQuoteRejected()` function
- `chat-event-bridge.ts` lines 306–330

---

### Step 19c — Customer REQUESTS CHANGES (Amendment)

**What the customer sees:**
- Amendment dialog with:
  - Description field for requested changes (required)
  - "Request Changes" button

**What happens on submit:**
1. `requestQuoteAmendment()` server action:
   - **Verifies email gate cookie** via `requireQuoteAccess(token)`.
   - Fetches quote by access token.
   - Validates status is `"sent"` or `"viewed"`.
   - Updates quote: status → `"pending_approval"`, stores amendment notes, increments `amendment_count` in metadata.
   - Logs activity with amendment number.
   - **Sends notifications:**
     - `notifyChatQuoteAmendmentRequested()` → customer chat message: _"Your change request for QUO-1234 has been submitted! ✅ We'll review your notes and send an updated quote."_
     - `notifyQuoteAmendmentRequested()` → in-app notification + email to store owner with the amendment notes.

**Files:**
- `quote-amendment-dialog.tsx` (UI)
- `quote-workflow-actions.ts` lines 722–840 (requestQuoteAmendment action)
- `business-notifications.ts` `notifyQuoteAmendmentRequested()` function
- `chat-event-bridge.ts` lines 332–358

---

## PHASE 7: Amendment Cycle (Repeatable)

### Step 20 — Store Owner Receives Amendment Notification

**What the store owner sees:**
- In-app notification: "Quote #QUO-1234 — Changes Requested"
- Email with the customer's amendment notes.

**What happens in code:**
- `notifyQuoteAmendmentRequested()` in `business-notifications.ts`:
  1. Creates in-app notification.
  2. Sends email to owner with quote number, customer name, and amendment notes.

---

### Step 21 — Store Owner Revises and Re-sends

**What the store owner does:**
1. Opens the quote from the notification link.
2. Clicks "Edit" → Quote Builder dialog.
3. Adjusts items, prices, or terms as requested.
4. Saves the quote (now in `"pending_approval"` status).
5. Clicks "Send Quote" → sends the revised quote email.

**What happens in code:**
- Same `sendQuote()` flow as Step 13. The action checks for `"pending_approval"` status (which amendment sets), so re-sending is allowed.
- Status updates back to `"sent"`.
- Customer receives a new email with updated details.
- Chat notification: _"Your quote QUO-1234 is ready (ZMW 32,000)! 🎉"_

This cycle can repeat multiple times. The `amendment_count` in metadata tracks how many times changes have been requested.

---

## PHASE 8: After Acceptance — Order Conversion

### Step 22 — Store Owner Converts Quote to Order

**What the store owner sees:**
- On accepted quotes, a "Convert to Order" button appears.
- Clicking it creates a real order from the quote data.

**What happens in code:**
1. `convertQuoteToOrder()` server action:
   - Fetches quote with all items.
   - Validates status is `"accepted"`.
   - Creates a new order in `mod_ecommod01_orders` with:
     - All prices converted from **main currency to cents** (×100) — critical conversion.
     - Customer details from the quote.
     - Order notes include quote reference.
   - Creates order items from quote items (prices also ×100).
   - Links to the payment summary.
   - Updates quote metadata with `converted_to_order_id` and `converted_to_order_number`.
   - Logs activity.
   - **Notifies chat** via `notifyChatQuoteConverted()`: _"Your quotation QUO-1234 has been converted to order ORD-5678 (ZMW 28,000)! You can now proceed with payment."_

**Critical price conversion:** Quote items store in **main currency** (e.g., 28000 = ZMW 28,000). Orders store in **cents** (e.g., 2800000). The `toCents()` helper (`Math.round(amount * 100)`) handles this conversion for subtotal, discount, tax, shipping, total, and each item's unit price and line total.

**Files:**
- `quote-workflow-actions.ts` lines 870–1050+ (convertQuoteToOrder)
- `chat-event-bridge.ts` lines 213–236

---

## Security Summary

| Layer | Protection |
|-------|-----------|
| Portal access | Email verification gate — customer must prove they own the email |
| Cookie auth | HMAC-SHA256 signed HttpOnly cookie, timing-safe comparison |
| Action verification | Every customer action (accept/reject/amend) calls `requireQuoteAccess()` server-side |
| Token security | Access tokens are random UUIDs (32 hex chars), not guessable |
| Rate limiting | Auth API: 15 requests/minute per IP |
| Cookie scope | Named per-quote (`qa_{token_prefix}`), 7-day expiry, Secure in production |

---

## Price Storage Convention

| Context | Unit | Example |
|---------|------|---------|
| Product `base_price` | Cents | 2800000 (= ZMW 28,000) |
| Cart items | Cents | 2800000 |
| Quote items (`unit_price`) | Main currency | 28000 (= ZMW 28,000) |
| Quote totals (`subtotal`, `total`) | Main currency | 28000 |
| Order items (`unit_price`) | Cents | 2800000 |
| Order totals (`subtotal`, `total`) | Cents | 2800000 |
| `formatCurrency()` expects | Main currency | 28000 → "ZMW 28,000.00" |

**Conversion at boundaries:**
- Cart → Quote items: ÷100 (cents → main)
- Quote → Order items: ×100 (main → cents)

---

## Chat Messages Throughout the Journey

| Event | Message to Customer | File |
|-------|-------------------|------|
| Quote submitted | "Quote QUO-1234 received! ✅ Our team will review your 3 items and email you when it's ready." | `chat-event-bridge.ts` |
| Quote sent by store | "Your quote QUO-1234 is ready (ZMW 28,000)! 🎉 Check your email to review and respond." | `chat-event-bridge.ts` |
| Customer accepts | "Quote QUO-1234 accepted (ZMW 28,000)! ✅ The store will process your order shortly." | `chat-event-bridge.ts` |
| Customer rejects | "Quote QUO-1234 declined. [Reason]. Let me know if you'd like a revised quote." | `chat-event-bridge.ts` |
| Customer requests changes | "Your change request for QUO-1234 has been submitted! ✅ We'll review your notes and send an updated quote." | `chat-event-bridge.ts` |
| Quote → Order converted | "Your quotation QUO-1234 has been converted to order ORD-5678 (ZMW 28,000)! You can now proceed with payment." | `chat-event-bridge.ts` |

---

## Status Flow

```
pending ──(store edits)──→ draft
pending ──(store sends)──→ sent
draft ───(store sends)───→ sent
sent ────(customer views)─→ viewed
viewed ──(customer accepts)→ accepted ──(store converts)→ converted
viewed ──(customer rejects)→ rejected
viewed ──(customer amends)─→ pending_approval ──(store re-sends)→ sent (cycle repeats)
sent ────(customer accepts)→ accepted
sent ────(customer rejects)→ rejected
sent ────(customer amends)─→ pending_approval
```

Any quote can also expire based on the `valid_until` date. Expired quotes show a disabled portal with no action buttons.
