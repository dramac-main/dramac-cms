# DRAMAC CMS — Automation Module Complete Overhaul

This document is a complete, self-contained AI prompt for building the full automation overhaul for the DRAMAC CMS platform. It contains every detail needed to implement, with zero ambiguity. Read the ENTIRE document before writing a single line of code.

---

## EXECUTIVE SUMMARY

Transform the automation module from an additive layer into the SINGLE SOURCE OF TRUTH for all customer-facing communications, notifications, and inter-module workflows. Every email, chat message, in-app notification, and AI response that touches a customer or business owner must be controllable, editable, and toggleable from the automation UI. Replace the current vertical step-list workflow builder with a professional drag-and-drop canvas using ReactFlow. Introduce Starter Packs (curated automation bundles) that auto-install on site creation based on installed modules.

---

## TABLE OF CONTENTS

1. Platform Architecture Overview
2. Current State Audit
3. Phase 1 — Event Emission Layer (replace hardcoded notifications)
4. Phase 2 — System Workflow Templates (default automations)
5. Phase 3 — Automation Starter Packs
6. Phase 4 — ReactFlow Canvas Builder
7. Phase 5 — Migration Safety and Fallback System
8. Phase 6 — Testing and Verification
9. Database Schema Changes
10. File-by-File Implementation Map
11. Business Types and Pack Definitions

---

## 1. PLATFORM ARCHITECTURE OVERVIEW

### Tech Stack

- Framework: Next.js 16.1.1, React 19.2.3, TypeScript
- Database: Supabase PostgreSQL (project ID: nfirsqmyxmmtbignofgb)
- Monorepo root: d:\dramac-cms
- Dashboard app: d:\dramac-cms\next-platform-dashboard
- Package manager: pnpm
- UI: Radix UI primitives, Tailwind CSS 4.x, Framer Motion 12.x
- State: Zustand 5.x, TanStack Query 5.x
- Existing DnD: @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0
- Charts: Recharts 3.x
- Page builder: Craft.js 0.2.12

### Module System

- Modules registered in `modules_v2` table (slug, name, category, capabilities, settings_schema)
- Sites install modules via `site_module_installations` table (site_id, module_id, is_enabled, settings)
- Agency subscriptions in `agency_module_subscriptions` table
- Core modules auto-installed on site creation: `crm`, `automation`, `live-chat`
- Optional modules installed by user: `ecommerce` (slug: ecommod01), `booking`, `domains`, etc.
- Module detection: `getSiteEnabledModules(siteId)` in `src/lib/actions/sites.ts` line 415 returns `Set<string>` of enabled slugs

### Site Creation Flow

- Function: `createSiteAction()` in `src/lib/actions/sites.ts` line 113
- Creates site row in `sites` table
- Creates default homepage in `pages` table
- Calls `installCoreModules(siteId, agencyId, userId)` at line 198
- `installCoreModules` installs CRM + Automation + Live Chat
- For live-chat, also calls `bootstrapLiveChatAgent()` from `src/modules/live-chat/lib/bootstrap-agent.ts`
- Core modules defined at line 14: `const CORE_MODULE_SLUGS = ["crm", "automation", "live-chat"] as const`

### Email System

- Primary send function: `sendBrandedEmail()` in `src/lib/email/send-branded-email.ts` line 63
- Accepts: agencyId, to, emailType (from EmailType union), data, siteId (for branding overlay)
- Flow: check opt-out → fetch branding → resolve template (DB custom → hardcoded fallback) → send via Resend → log
- Template resolution: `resolveEmailTemplate()` in `src/lib/email/template-resolver.ts` line 169
- Hardcoded templates: `BRANDED_TEMPLATES` in `src/lib/email/templates/branded-templates.ts` line 1250 (~40+ templates)
- Simple send: `sendEmail()` in `src/lib/email/send-email.ts` (non-branded, platform-level)
- EmailType union in `src/lib/email/email-types.ts` (~50 types)
- Channel gating: `shouldSendEmail()` / `shouldSendInApp()` from notification-prefs.ts

### Chat Event Bridge (proactive chat messages)

- File: `src/modules/live-chat/lib/chat-event-bridge.ts`
- 15 exported functions that send proactive system messages into chat conversations
- Each function resolves message template from DB first, falls back to hardcoded default
- Template resolver: `resolveChatMessage(siteId, eventType, defaultMessage, placeholders)` from `src/modules/live-chat/lib/chat-template-resolver.ts`
- 21 ChatMessageEventType values defined

---

## 2. CURRENT STATE AUDIT

### 2A. All Hardcoded Notification Dispatch Points (~85 total)

#### business-notifications.ts — 18 Functions (in-app + email)

Location: `src/services/business-notifications.ts`

| Function                      | Channels       | Recipients       | Trigger                   |
| ----------------------------- | -------------- | ---------------- | ------------------------- |
| notifyNewBooking              | In-app + Email | Owner + Customer | Public booking created    |
| notifyBookingCancelled        | In-app + Email | Owner + Customer | Booking cancelled         |
| notifyBookingConfirmed        | Email          | Owner + Customer | Status → confirmed        |
| notifyBookingCompleted        | Email          | Owner + Customer | Status → completed        |
| notifyBookingNoShow           | Email          | Customer         | Status → no_show          |
| notifyBookingPaymentReceived  | Email          | Owner + Customer | Payment marked paid       |
| notifyNewOrder                | In-app + Email | Owner + Customer | Storefront checkout       |
| notifyOrderShipped            | In-app + Email | Customer         | Status → shipped          |
| notifyOrderDelivered          | In-app + Email | Customer         | Status → delivered        |
| notifyOrderCancelled          | In-app + Email | Owner + Customer | Status → cancelled        |
| notifyPaymentReceived         | In-app + Email | Customer         | Payment confirmed         |
| notifyPaymentProofUploaded    | In-app + Email | Owner            | Customer uploads proof    |
| notifyRefundIssued            | In-app + Email | Customer         | Refund processed          |
| notifyLowStock                | In-app + Email | Owner            | Inventory below threshold |
| notifyNewQuote                | In-app + Email | Owner + Customer | Quote created             |
| notifyQuoteAccepted           | In-app + Email | Owner + Customer | Customer accepts quote    |
| notifyQuoteRejected           | In-app + Email | Owner            | Customer rejects          |
| notifyQuoteAmendmentRequested | In-app + Email | Owner            | Customer requests changes |

#### Chat Event Bridge — 15 Functions (proactive chat messages)

Location: `src/modules/live-chat/lib/chat-event-bridge.ts`

| Function                          | Event Type                                                      | Default Message                               |
| --------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| notifyChatPaymentProofUploaded    | payment_proof_uploaded                                          | "Great news! I can see your payment proof..." |
| notifyChatPaymentConfirmed        | payment_confirmed                                               | "Your payment for order...confirmed!"         |
| notifyChatOrderStatusChanged      | order_confirmed/processing/shipped/delivered/cancelled/refunded | 6 status-specific messages                    |
| notifyChatQuoteConverted          | quote_converted                                                 | "Your quotation...converted to order..."      |
| notifyChatQuoteRequested          | quote_requested                                                 | "Quote received! Our team will review..."     |
| notifyChatQuoteSent               | quote_sent                                                      | "Your quote is ready! Check email..."         |
| notifyChatQuoteAccepted           | quote_accepted                                                  | "Quote accepted! The store will process..."   |
| notifyChatQuoteRejected           | quote_rejected                                                  | "Quote declined. Let me know if..."           |
| notifyChatQuoteAmendmentRequested | quote_amendment_requested                                       | "Your change request submitted!"              |
| notifyChatBookingCreated          | booking_created                                                 | "Your booking received!"                      |
| notifyChatBookingConfirmed        | booking_confirmed                                               | "Great news — booking confirmed!"             |
| notifyChatBookingCancelled        | booking_cancelled                                               | "Your booking cancelled..."                   |
| notifyChatBookingRescheduled      | booking_rescheduled                                             | "Your booking rescheduled to..."              |
| notifyChatBookingCompleted        | booking_completed                                               | "Your booking complete!"                      |
| notifyChatBookingPaymentConfirmed | booking_payment_confirmed                                       | "Payment of...confirmed!"                     |

#### Chat Notifications — 5 Functions (in-app for agents)

Location: `src/modules/live-chat/lib/chat-notifications.ts`

| Function             | Channel | Recipient     | Trigger                |
| -------------------- | ------- | ------------- | ---------------------- |
| notifyNewChatMessage | In-app  | Agent/Owner   | New visitor message    |
| notifyChatAssigned   | In-app  | Agent         | Chat assigned          |
| notifyChatMissed     | In-app  | Owner         | No agent responded     |
| notifyChatRating     | In-app  | Agent + Owner | Visitor rates chat     |
| sendTranscriptEmail  | Email   | —             | STUB — not implemented |

#### Direct Email Sends (bypassing business-notifications.ts)

| File                            | Function/Call              | Email Type                      | Trigger                |
| ------------------------------- | -------------------------- | ------------------------------- | ---------------------- |
| order-actions.ts:720            | sendBrandedEmail           | payment_proof_rejected_customer | Proof rejected         |
| order-actions.ts:1067-1156      | sendBrandedEmail (5 calls) | Various resend types            | Manual resend by admin |
| quote-workflow-actions.ts:234   | sendBrandedEmail           | quote_sent_customer             | Quote sent             |
| quote-workflow-actions.ts:345   | sendBrandedEmail           | quote_sent_customer             | Quote resent           |
| quote-workflow-actions.ts:429   | sendBrandedEmail           | quote_reminder_customer         | Manual reminder        |
| api/forms/submit/route.ts:395   | sendBrandedEmail           | form_submission_owner           | Form submitted         |
| api/cron/domains/route.ts:112   | sendEmail                  | domain_expiring                 | Cron job               |
| api/ecommerce/auth/route.ts:766 | sendEmail                  | storefront_magic_link           | Customer login         |

#### Payment Webhooks — 7 Call Sites

Location: `src/app/api/modules/ecommerce/webhooks/payment/route.ts`
Each gateway (Paddle, Flutterwave, PayStack, DPO, Pesapal, Paychangu) calls `notifyPaymentReceived()` and/or `notifyRefundIssued()`.

#### Full Call Site Map Per Module

BOOKING MODULE:

- public-booking-actions.ts:599 → notifyNewBooking
- booking-actions.ts:637 → notifyChatBookingCreated
- booking-actions.ts:723 → notifyBookingConfirmed
- booking-actions.ts:726 → notifyChatBookingConfirmed
- booking-actions.ts:736 → notifyBookingCompleted
- booking-actions.ts:739 → notifyChatBookingCompleted
- booking-actions.ts:747 → notifyBookingNoShow
- booking-actions.ts:790 → notifyBookingCancelled
- booking-actions.ts:809 → notifyChatBookingCancelled
- chat-booking-actions.ts:270 → notifyBookingConfirmed
- chat-booking-actions.ts:275 → notifyChatBookingConfirmed
- chat-booking-actions.ts:286 → notifyBookingCompleted
- chat-booking-actions.ts:290 → notifyChatBookingCompleted
- chat-booking-actions.ts:296 → notifyBookingCancelled
- chat-booking-actions.ts:313 → notifyChatBookingCancelled
- chat-booking-actions.ts:323 → notifyBookingNoShow
- chat-booking-actions.ts:395 → notifyBookingPaymentReceived
- chat-booking-actions.ts:418 → notifyChatBookingPaymentConfirmed

E-COMMERCE MODULE:

- public-ecommerce-actions.ts:1285 → notifyNewOrder (auto checkout)
- public-ecommerce-actions.ts:1325 → notifyNewOrder (manual payment)
- public-ecommerce-actions.ts:1778 → notifyPaymentProofUploaded
- ecommerce-actions.ts:1521 → notifyOrderCancelled
- ecommerce-actions.ts:1534 → notifyOrderShipped
- ecommerce-actions.ts:1633 → notifyOrderShipped (fulfilled)
- ecommerce-actions.ts:1671 → notifyOrderDelivered
- order-actions.ts:278 → logAutomationEvent('ecommerce.order.status_changed') [event only]
- order-actions.ts:310 → notifyChatOrderStatusChanged
- order-actions.ts:482 → logAutomationEvent('ecommerce.order.shipped') [event only]
- order-actions.ts:672 → notifyPaymentReceived
- order-actions.ts:720 → sendBrandedEmail (proof rejected)
- order-actions.ts:858 → logAutomationEvent('ecommerce.order.refunded') [event only]

QUOTE MODULE:

- quote-actions.ts:1187 → notifyNewQuote (via wrapper)
- quote-actions.ts:1239 → notifyChatQuoteRequested
- quote-workflow-actions.ts:234 → sendBrandedEmail (quote sent)
- quote-workflow-actions.ts:265 → notifyChatQuoteSent
- quote-workflow-actions.ts:345 → sendBrandedEmail (quote resent)
- quote-workflow-actions.ts:429 → sendBrandedEmail (quote reminder)
- quote-workflow-actions.ts:647 → notifyQuoteAccepted
- quote-workflow-actions.ts:660 → notifyChatQuoteAccepted
- quote-workflow-actions.ts:749 → notifyQuoteRejected
- quote-workflow-actions.ts:768 → notifyChatQuoteRejected
- quote-workflow-actions.ts:820 → notifyQuoteAmendmentRequested
- quote-workflow-actions.ts:840 → notifyChatQuoteAmendmentRequested
- quote-workflow-actions.ts:1138 → notifyNewOrder (quote→order conversion)
- quote-workflow-actions.ts:1170 → notifyChatQuoteConverted

### 2B. Existing Automation Event Emissions (33 call sites)

These events are ALREADY being emitted via `logAutomationEvent()`:

| Event Type                                                   | File                                                    | Context        |
| ------------------------------------------------------------ | ------------------------------------------------------- | -------------- |
| booking.appointment.created                                  | public-booking-actions.ts:619                           | Public booking |
| booking.appointment.cancelled                                | booking-actions.ts:820                                  | Cancellation   |
| crm.contact.created                                          | crm-actions.ts:138 + crm-bridge.ts:132                  | Manual + auto  |
| crm.contact.updated                                          | crm-actions.ts:188                                      | Manual update  |
| crm.contact.deleted                                          | crm-actions.ts:228                                      | Delete         |
| crm.contact.merged                                           | bulk-actions.ts:386                                     | Merge          |
| crm.contacts.imported                                        | bulk-actions.ts:498                                     | CSV import     |
| crm.deal.created                                             | crm-actions.ts:412 + crm-bridge.ts:252                  | Manual + auto  |
| crm.deal.updated                                             | crm-actions.ts:456                                      | Manual         |
| crm.deal.deleted                                             | crm-actions.ts:495                                      | Delete         |
| crm.deal.stage_changed                                       | crm-actions.ts:565                                      | Stage move     |
| crm.deal.won                                                 | crm-actions.ts:590                                      | Won stage      |
| crm.deal.lost                                                | crm-actions.ts:603                                      | Lost stage     |
| crm.email.sent                                               | email-actions.ts:105                                    | CRM email      |
| ecommerce.order.created                                      | public-ecommerce-actions.ts:1360                        | Checkout       |
| ecommerce.order.status_changed                               | order-actions.ts:278 + public-ecommerce-actions.ts:1421 | Status change  |
| ecommerce.order.shipped                                      | order-actions.ts:482                                    | Shipment added |
| ecommerce.order.refunded                                     | order-actions.ts:858                                    | Refund         |
| ecommerce.order.payment_updated                              | public-ecommerce-actions.ts:1472                        | Payment status |
| live-chat.conversation.started                               | conversation-actions.ts:275                             | New chat       |
| live-chat.conversation.resolved                              | conversation-actions.ts:565                             | Resolved       |
| live-chat.conversation.closed                                | conversation-actions.ts:651                             | Closed         |
| ai_agent.agent.created/updated/deleted/activated/deactivated | ai-agents/actions.ts                                    | Agent CRUD     |
| ai_agent.execution.started/completed/failed                  | execution-actions.ts + trigger-handler.ts               | Agent runs     |

### 2C. Events DEFINED in Registry but NOT Emitted

The EVENT_REGISTRY in `src/modules/automation/lib/event-types.ts` defines ~120 event types across 10 categories. Many have NO call sites:

- booking.appointment.confirmed/rescheduled/completed/no_show/reminder_sent
- booking.availability.updated/blocked
- booking.service.created/updated
- ecommerce.order.paid/delivered/cancelled
- ecommerce.cart.abandoned/recovered
- ecommerce.product.low_stock/out_of_stock/restocked
- ecommerce.customer.created/first_purchase
- All form.\* events (submission.received etc.)
- All accounting.\* events (entire category)
- All domain.\* events (entire category)
- All billing.\* events (entire category)
- All system.\* events
- All automation.workflow/step.\* events

### 2D. Current Automation Module Structure

47 files, ~18,000 lines. Key components:

SERVICES:

- execution-engine.ts (683 lines): Step-by-step workflow runner, variable resolution ({{trigger.field}}, {{steps.name.output}}, {{variables.var}}), condition evaluation (15+ operators), duration parsing
- event-processor.ts (616 lines): Event intake + immediate workflow triggering, filter matching (MongoDB-style: $eq, $ne, $gt, $gte, $lt, $lte, $contains, $in, $nin, $exists), scheduled jobs, webhook processing
- action-executor.ts (1507 lines): 10 switch categories (crm, ecommerce, booking, chat, email, notification, webhook, data, transform, flow), 57 total action implementations
- ai-actions.ts (643 lines): OpenAI-powered text generation actions

LIB:

- action-types.ts (2353 lines): ACTION_REGISTRY with 11 categories, 57 action definitions with full input/output field schemas
- event-types.ts (551 lines): EVENT_REGISTRY with 10 categories, ~120 event type definitions
- templates.ts (1906 lines): 28 workflow templates, helper functions (getTemplatesByCategory, searchTemplates, etc.)

ACTIONS:

- automation-actions.ts (1795 lines): Full CRUD server actions — workflow, step, execution, connection, webhook, event subscription management. Key function: createWorkflowFromTemplate (line 1931)

COMPONENTS:

- template-gallery.tsx (382 lines): Template browsing UI with category tabs, search, grid, preview
- WorkflowBuilderEnhanced.tsx (591 lines): Enhanced builder wrapper
- workflow-builder/workflow-builder.tsx (440 lines): Main layout (sidebar + canvas + config panel)
- workflow-builder/workflow-canvas.tsx (319 lines): Vertical sortable list of steps (uses @dnd-kit)
- workflow-builder/step-config-panel.tsx (547 lines): Step configuration sidebar
- workflow-builder/trigger-panel.tsx (357 lines): Trigger configuration
- workflow-builder/action-palette.tsx (217 lines): Draggable action list
- 12 ui/ component files (analytics, cards, timeline, etc.)

HOOKS:

- use-workflow-builder.ts (488 lines): React state for load/save/add/update/delete/reorder steps, optimistic updates, auto-save, dirty tracking

TYPES:

- automation-types.ts (503 lines): TriggerType, StepType, ExecutionStatus, Workflow, WorkflowStep, ExecutionContext, ActionResult, etc.

DB TABLES (10):

- automation_workflows (trigger_type, trigger_config, is_active, stats counters)
- workflow_steps (position, step_type, action_type, action_config, condition_config, delay_config)
- workflow_executions (status lifecycle: pending→running→completed/failed/paused/cancelled)
- step_execution_logs (per-step input/output/duration/error)
- workflow_variables (workflow-scoped key-value pairs)
- automation_event_subscriptions (workflow_id, event_type, event_filter, is_active)
- automation_events_log (event_type, payload, processed flag)
- automation_scheduled_jobs (cron schedule, next_run_at)
- automation_connections (service type, credentials, encrypted)
- automation_webhook_endpoints (endpoint_path, secret_key, HMAC verification)

---

## 3. PHASE 1 — EVENT EMISSION LAYER

### Goal

Ensure EVERY notification-worthy event in the platform emits an automation event. This is the foundation — hardcoded notifications remain as fallbacks during this phase.

### 3A. Add Missing Event Emissions

Add `logAutomationEvent()` calls at EVERY notification dispatch point that does not already emit one. Import from: `import { logAutomationEvent } from '@/modules/automation/services/event-processor'`

BOOKING — Add These Events:

- booking-actions.ts after status→confirmed: emit `booking.appointment.confirmed`
- booking-actions.ts after status→completed: emit `booking.appointment.completed`
- booking-actions.ts after status→no_show: emit `booking.appointment.no_show`
- chat-booking-actions.ts after status→confirmed: emit `booking.appointment.confirmed`
- chat-booking-actions.ts after status→completed: emit `booking.appointment.completed`
- chat-booking-actions.ts after status→cancelled: emit `booking.appointment.cancelled`
- chat-booking-actions.ts after status→no_show: emit `booking.appointment.no_show`
- chat-booking-actions.ts after payment marked: emit `booking.appointment.payment_received`
- public-booking-actions.ts — already emits booking.appointment.created ✓

E-COMMERCE — Add These Events:

- public-ecommerce-actions.ts after checkout: emit `ecommerce.order.paid` (for auto-payment orders)
- ecommerce-actions.ts:1521 after cancel: emit `ecommerce.order.cancelled`
- ecommerce-actions.ts:1534 after ship: already has order.shipped from order-actions ✓
- ecommerce-actions.ts:1671 after deliver: emit `ecommerce.order.delivered`
- order-actions.ts:672 after payment verified: emit `ecommerce.payment.received`
- order-actions.ts:720 after proof rejected: emit `ecommerce.payment.proof_rejected`
- public-ecommerce-actions.ts:1778 after proof uploaded: emit `ecommerce.payment.proof_uploaded`
- Payment webhook route: emit `ecommerce.payment.received` for each gateway success (7 sites)
- Payment webhook route: emit `ecommerce.refund.processed` for PayStack refund

QUOTE — Add These Events:

- quote-actions.ts after create: emit `ecommerce.quote.created`
- quote-workflow-actions.ts after send: emit `ecommerce.quote.sent`
- quote-workflow-actions.ts after resend: emit `ecommerce.quote.resent`
- quote-workflow-actions.ts after reminder: emit `ecommerce.quote.reminder_sent`
- quote-workflow-actions.ts after accept: emit `ecommerce.quote.accepted`
- quote-workflow-actions.ts after reject: emit `ecommerce.quote.rejected`
- quote-workflow-actions.ts after amendment: emit `ecommerce.quote.amendment_requested`
- quote-workflow-actions.ts after convert: emit `ecommerce.quote.converted_to_order`

LOW STOCK:

- Wherever notifyLowStock is called: emit `ecommerce.product.low_stock`

FORMS:

- api/forms/submit/route.ts: emit `form.submission.received`

LIVE CHAT:

- conversation-actions.ts: already emits started/resolved/closed ✓
- message-actions.ts for @mentions: emit `live-chat.message.agent_mentioned`
- chat-notifications.ts missed: emit `live-chat.conversation.missed`

### 3B. Event Payload Standards

Every emitted event MUST include a standardized payload so automation workflows can reference fields consistently. Minimum required fields per category:

BOOKING EVENTS payload:

```typescript
{
  appointment_id: string
  site_id: string
  service_name: string
  staff_name: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  start_time: string (ISO)
  end_time: string (ISO)
  status: AppointmentStatus
  payment_status?: string
  payment_amount?: number
  cancellation_reason?: string
  cancelled_by?: CancelledBy
  conversation_id?: string
}
```

ORDER EVENTS payload:

```typescript
{
  order_id: string
  order_number: string
  site_id: string
  customer_email: string
  customer_first_name: string
  customer_last_name: string
  customer_phone?: string
  total_amount: number
  currency: string
  status: string
  payment_status: string
  items_count: number
  tracking_number?: string
  carrier?: string
  conversation_id?: string
}
```

QUOTE EVENTS payload:

```typescript
{
  quote_id: string
  quote_number: string
  site_id: string
  customer_email: string
  customer_first_name: string
  customer_last_name: string
  total_amount: number
  currency: string
  status: QuoteStatus
  rejection_reason?: string
  amendment_notes?: string
  conversation_id?: string
}
```

PAYMENT EVENTS payload:

```typescript
{
  order_id: string
  order_number: string
  site_id: string
  customer_email: string
  amount: number
  currency: string
  gateway: string
  transaction_id?: string
  refund_amount?: number
  refund_reason?: string
}
```

FORM EVENTS payload:

```typescript
{
  form_id: string
  site_id: string
  submission_id: string
  form_name: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  message?: string
  fields: Record<string, unknown>
}
```

CHAT EVENTS payload:

```typescript
{
  conversation_id: string
  site_id: string
  visitor_name?: string
  visitor_email?: string
  page_url?: string
  agent_id?: string
  agent_name?: string
  duration_minutes?: number
  rating?: number
}
```

### 3C. Update EVENT_REGISTRY

Add all new event types to `src/modules/automation/lib/event-types.ts` that are not already defined. Ensure every event type that is emitted in code has a matching registry entry with proper description, category, and payload schema.

---

## 4. PHASE 2 — SYSTEM WORKFLOW TEMPLATES

### Goal

Create "System Automation" workflows for EVERY hardcoded notification. These are pre-built workflow templates that replicate the exact behavior of the current hardcoded notification functions. They will be installable and editable.

### 4A. New Workflow Template Concept: System Templates

Add a new field to the WorkflowTemplate type:

```typescript
interface WorkflowTemplate {
  // ... existing fields ...
  isSystem?: boolean; // True for templates that replace hardcoded notifications
  systemEventType?: string; // The event type this replaces (for deduplication)
  defaultActive?: boolean; // Should activate immediately on install
  pack?: string; // Which starter pack this belongs to
}
```

### 4B. System Templates to Create

Create these system workflow templates in `templates.ts`. Each one MUST replicate the EXACT behavior of its hardcoded counterpart (same email type, same recipients, same chat message, same in-app notification).

BOOKING SYSTEM TEMPLATES (8):

1. `system-booking-created` — Trigger: booking.appointment.created → Actions: email.send_template (booking_confirmation_customer to customer + booking_confirmation_owner to owner) + notification.in_app (to owner) + chat.send_message (booking created message). Pack: booking.
2. `system-booking-confirmed` — Trigger: booking.appointment.confirmed → Actions: email.send_template (booking_confirmed_customer + booking_confirmed_owner) + chat.send_message (booking confirmed). Pack: booking.
3. `system-booking-cancelled` — Trigger: booking.appointment.cancelled → Actions: email.send_template (booking_cancelled_customer + booking_cancelled_owner) + notification.in_app (to owner) + chat.send_message (booking cancelled). Pack: booking.
4. `system-booking-completed` — Trigger: booking.appointment.completed → Actions: email.send_template (booking_completed_customer + booking_completed_owner) + chat.send_message (booking completed). Pack: booking.
5. `system-booking-no-show` — Trigger: booking.appointment.no_show → Actions: email.send_template (booking_no_show_customer). Pack: booking.
6. `system-booking-payment-received` — Trigger: booking.appointment.payment_received → Actions: email.send_template (booking_payment_received_customer + booking_payment_received_owner) + chat.send_message (payment confirmed). Pack: booking.
7. `system-booking-reminder` — Trigger: schedule (24h before appointment) → Actions: email.send_template (appointment reminder) + chat.send_message (reminder). Pack: booking.
8. `system-booking-cancelled-followup` — Trigger: booking.appointment.cancelled → Actions: flow.delay(1h) → email.send (reschedule invitation). Pack: booking.

ORDER SYSTEM TEMPLATES (8):

1. `system-order-created` — Trigger: ecommerce.order.created → Actions: email.send_template (order_confirmation_customer + order_confirmation_owner) + notification.in_app (to owner). Pack: ecommerce.
2. `system-order-shipped` — Trigger: ecommerce.order.shipped → Actions: email.send_template (order_shipped_customer) + notification.in_app + chat.send_message (order shipped). Pack: ecommerce.
3. `system-order-delivered` — Trigger: ecommerce.order.delivered → Actions: email.send_template (order_delivered_customer) + notification.in_app + chat.send_message (order delivered). Pack: ecommerce.
4. `system-order-cancelled` — Trigger: ecommerce.order.cancelled → Actions: email.send_template (order_cancelled_customer + order_cancelled_owner) + notification.in_app + chat.send_message (order cancelled). Pack: ecommerce.
5. `system-payment-received` — Trigger: ecommerce.payment.received → Actions: email.send_template (payment_received_customer) + notification.in_app + chat.send_message (payment confirmed). Pack: ecommerce.
6. `system-payment-proof-uploaded` — Trigger: ecommerce.payment.proof_uploaded → Actions: email.send_template (payment_proof_uploaded_owner) + notification.in_app (to owner) + chat.send_message (proof uploaded). Pack: ecommerce.
7. `system-refund-issued` — Trigger: ecommerce.order.refunded → Actions: email.send_template (refund_issued_customer) + notification.in_app + chat.send_message (order refunded). Pack: ecommerce.
8. `system-low-stock-alert` — Trigger: ecommerce.product.low_stock → Actions: email.send_template (low_stock_admin) + notification.in_app (to owner). Pack: ecommerce.

QUOTE SYSTEM TEMPLATES (7):

1. `system-quote-created` — Trigger: ecommerce.quote.created → Actions: email.send_template (quote_request_owner + quote_request_customer) + notification.in_app + chat.send_message (quote requested). Pack: ecommerce.
2. `system-quote-sent` — Trigger: ecommerce.quote.sent → Actions: email.send_template (quote_sent_customer) + chat.send_message (quote sent). Pack: ecommerce.
3. `system-quote-reminder` — Trigger: ecommerce.quote.reminder_sent → Actions: email.send_template (quote_reminder_customer). Pack: ecommerce.
4. `system-quote-accepted` — Trigger: ecommerce.quote.accepted → Actions: email.send_template (quote_accepted_owner + quote_accepted_customer) + notification.in_app + chat.send_message (quote accepted). Pack: ecommerce.
5. `system-quote-rejected` — Trigger: ecommerce.quote.rejected → Actions: email.send_template (quote_rejected_owner) + notification.in_app + chat.send_message (quote rejected). Pack: ecommerce.
6. `system-quote-amendment` — Trigger: ecommerce.quote.amendment_requested → Actions: email.send_template (quote_amendment_requested_owner) + notification.in_app + chat.send_message (amendment requested). Pack: ecommerce.
7. `system-quote-converted` — Trigger: ecommerce.quote.converted_to_order → Actions: email.send_template (order_confirmation_customer + order_confirmation_owner) + notification.in_app + chat.send_message (quote converted). Pack: ecommerce.

FORM SYSTEM TEMPLATE (1):

1. `system-form-submission` — Trigger: form.submission.received → Actions: email.send_template (form_submission_owner) + notification.in_app (to owner). Pack: default.

CHAT SYSTEM TEMPLATES (3):

1. `system-chat-new-message` — Trigger: live-chat.message.received → Actions: notification.in_app (to assigned agent or owner). Pack: default.
2. `system-chat-missed` — Trigger: live-chat.conversation.missed → Actions: notification.in_app (to owner) + email.send (missed chat alert). Pack: default.
3. `system-chat-assigned` — Trigger: live-chat.conversation.assigned → Actions: notification.in_app (to assigned agent). Pack: default.

### 4C. New Action Type: email.send_branded_template

The current `email.send_template` action in the executor uses `sendEmail()` (non-branded). For system workflows that replace hardcoded notifications, we NEED a new action that uses `sendBrandedEmail()`.

Add to ACTION_REGISTRY and action-executor.ts:

- `email.send_branded_template` — accepts: emailType (from EmailType union), to (email address or {{trigger.customer_email}}), data (merge variables from trigger), siteId (from context)
- Implementation: calls `sendBrandedEmail(agencyId, { to, emailType, data, siteId })`
- This ensures system workflows send the EXACT same branded emails as the hardcoded functions

### 4D. New Action Type: chat.send_system_message

For the chat event bridge messages, add:

- `chat.send_system_message` — accepts: conversation_id, event_type (ChatMessageEventType), custom_message (optional override)
- Implementation: calls `resolveChatMessage()` to get DB-customized or default message, then inserts into conversation
- This preserves the existing chat template customization behavior

### 4E. New Action Type: notification.in_app_targeted

The current `notification.in_app` action is generic. For system workflows that need to notify specific roles:

- `notification.in_app_targeted` — accepts: title, message, type, target_role ('owner' | 'agent' | 'all'), target_user_id (optional)
- Implementation: resolves target user based on site ownership or assignment, creates notification

---

## 5. PHASE 3 — AUTOMATION STARTER PACKS

### Goal

Create curated bundles of workflows that install with one click, or automatically on site creation based on installed modules.

### 5A. Pack Definitions

Define packs in a new file: `src/modules/automation/lib/starter-packs.ts`

```typescript
interface StarterPack {
  id: string;
  name: string;
  description: string;
  icon: string;
  templateIds: string[]; // References WorkflowTemplate.id values
  autoInstallForModules?: string[]; // Module slugs that trigger auto-install
  activateOnInstall: boolean; // Whether workflows start active immediately
  isSystemPack: boolean; // System packs cannot be uninstalled
  category: "system" | "growth" | "engagement" | "operations";
}
```

PACKS TO CREATE:

1. ESSENTIAL COMMUNICATIONS PACK (auto-install for ALL sites):
   - id: 'essential-communications'
   - autoInstallForModules: [] (empty = always install)
   - activateOnInstall: true
   - isSystemPack: true
   - Templates: system-form-submission, system-chat-new-message, system-chat-missed, system-chat-assigned

2. BOOKING COMMUNICATIONS PACK (auto-install when booking module present):
   - id: 'booking-communications'
   - autoInstallForModules: ['booking']
   - activateOnInstall: true
   - isSystemPack: true
   - Templates: system-booking-created, system-booking-confirmed, system-booking-cancelled, system-booking-completed, system-booking-no-show, system-booking-payment-received, system-booking-reminder, system-booking-cancelled-followup

3. E-COMMERCE COMMUNICATIONS PACK (auto-install when ecommerce module present):
   - id: 'ecommerce-communications'
   - autoInstallForModules: ['ecommod01']
   - activateOnInstall: true
   - isSystemPack: true
   - Templates: All 8 order templates + all 7 quote templates + system-low-stock-alert

4. BOOKING GROWTH PACK (optional, user-installed):
   - id: 'booking-growth'
   - autoInstallForModules: undefined (manual only)
   - activateOnInstall: false
   - Templates: booking-to-crm-contact, booking-cancelled-followup, post-appointment-feedback, no-show-followup, booking-confirmation-chat

5. E-COMMERCE GROWTH PACK (optional, user-installed):
   - id: 'ecommerce-growth'
   - autoInstallForModules: undefined (manual only)
   - activateOnInstall: false
   - Templates: order-to-crm-contact, abandoned-cart-recovery, first-purchase-thank-you, quote-accepted-to-order, quote-reminder-sequence, low-stock-multi-alert, refund-processed-workflow

6. LEAD GENERATION PACK (optional, user-installed):
   - id: 'lead-generation'
   - autoInstallForModules: undefined
   - activateOnInstall: false
   - Templates: lead-welcome-sequence, lead-scoring-automation, lead-nurture-drip, form-submission-handler, webhook-to-crm, chat-to-crm-contact

7. CUSTOMER SUCCESS PACK (optional, user-installed):
   - id: 'customer-success'
   - autoInstallForModules: undefined
   - activateOnInstall: false
   - Templates: customer-onboarding, chat-resolved-satisfaction, chat-vip-escalation, deal-won-to-quote

### 5B. Pack Installation Server Action

Add to `automation-actions.ts`:

```typescript
export async function installStarterPack(
  siteId: string,
  packId: string,
): Promise<{
  success: boolean;
  workflowsCreated: number;
  errors: string[];
}>;
```

Flow:

1. Load pack definition by ID
2. Check if pack already installed (query workflows with `category: pack.id`)
3. For each templateId in pack.templateIds:
   a. Get template from WORKFLOW_TEMPLATES
   b. Call createWorkflowFromTemplate with template data
   c. If pack.activateOnInstall, immediately call activateWorkflow
   d. Mark workflow with metadata: `{ system: pack.isSystemPack, pack_id: pack.id }`
4. Return summary

### 5C. Auto-Install on Site Creation

Modify `installCoreModules()` in `src/lib/actions/sites.ts`:

After installing the automation module, add:

```typescript
// After automation module is installed
if (slug === "automation") {
  await installDefaultAutomationPacks(siteId, agencyId);
}
```

New function `installDefaultAutomationPacks`:

1. Always install 'essential-communications' pack
2. Query `site_module_installations` to see what other modules are installed
3. For each installed module, check if any pack has `autoInstallForModules` matching that slug
4. Install those packs

ALSO: When ANY new module is installed on an existing site (via the module marketplace), check if there's a pack that should auto-install for it. Add a hook in the module installation flow (wherever modules are installed for existing sites — likely in a module installation action).

### 5D. Pack Gallery UI

Add a new section to `template-gallery.tsx` ABOVE the individual templates grid:

- Show pack cards in a horizontal scrollable row or 2-column grid
- Each pack card shows: icon, name, description, number of templates, "Install Pack" button
- Installed packs show a checkmark and "Installed" badge
- System packs show a "System" badge and cannot be uninstalled
- Clicking a pack card expands an overlay showing all templates in the pack with toggle switches for each

---

## 6. PHASE 4 — REACTFLOW CANVAS BUILDER

### Goal

Replace the current vertical sortable list with a professional visual flow canvas using @xyflow/react.

### 6A. Install ReactFlow

```bash
cd next-platform-dashboard
pnpm add @xyflow/react
```

The library is MIT licensed, has 36k GitHub stars, 4.19M weekly npm downloads, supports React 19, and works with Next.js App Router (requires "use client").

### 6B. Node Types to Create

Create custom ReactFlow node components in `src/modules/automation/components/canvas/nodes/`:

1. TriggerNode — The start node. Shows trigger type icon + event name. Single output handle at bottom. Green accent color. Cannot be deleted.
2. ActionNode — Standard action step. Shows action icon + name + brief config summary. Input handle at top, output handle at bottom. Blue accent.
3. ConditionNode — Diamond/rhombus shape (or wide card). Shows condition expression. Input handle at top, TWO output handles: "True" (right/bottom-left) and "False" (left/bottom-right). Yellow accent.
4. DelayNode — Shows clock icon + duration text. Single input, single output. Purple accent.
5. LoopNode — Shows repeat icon + iteration config. Single input, two outputs: "Loop Body" and "Done". Orange accent.
6. EndNode — Terminal node. Shows checkmark. Single input handle. Gray accent. Auto-placed.
7. NoteNode — Sticky note for documentation. No handles. Resizable. Light yellow background.

Each node component receives the workflow step data via ReactFlow's `data` prop and renders a styled card matching the existing dark theme (bg-card border-border).

### 6C. Edge Types to Create

Create custom edge components in `src/modules/automation/components/canvas/edges/`:

1. DefaultEdge — Smooth step edge (smoothstep type). Animated dash pattern when workflow is running. Label for condition branches ("True" / "False"). Delete button on hover.
2. LoopbackEdge — Curved edge that loops back to an earlier node. Dashed style with arrow.

### 6D. Canvas Component Architecture

```
src/modules/automation/components/canvas/
├── AutomationCanvas.tsx          — Main ReactFlow wrapper
├── CanvasControls.tsx            — Zoom, fit, minimap, lock toggles
├── CanvasSidebar.tsx             — Action palette (drag to canvas)
├── nodes/
│   ├── TriggerNode.tsx
│   ├── ActionNode.tsx
│   ├── ConditionNode.tsx
│   ├── DelayNode.tsx
│   ├── LoopNode.tsx
│   ├── EndNode.tsx
│   └── NoteNode.tsx
├── edges/
│   ├── DefaultEdge.tsx
│   └── LoopbackEdge.tsx
├── panels/
│   ├── NodeConfigPanel.tsx       — Right sidebar for editing selected node
│   ├── TriggerConfigPanel.tsx    — Trigger configuration
│   └── WorkflowSettingsPanel.tsx — Workflow metadata
└── utils/
    ├── layout.ts                 — Auto-layout using dagre algorithm
    ├── converters.ts             — Convert steps↔nodes/edges
    └── validation.ts             — Validate graph connectivity
```

### 6E. AutomationCanvas.tsx — Main Component

```typescript
'use client'

import { ReactFlow, MiniMap, Controls, Background, ... } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
```

Key features:

- Initialize with `useNodesState` and `useEdgesState` for reactive state
- Register custom node types via `nodeTypes` prop
- Register custom edge types via `edgeTypes` prop
- Handle `onConnect` for creating edges between nodes
- Handle `onNodesDelete` and `onEdgesDelete` for removing steps
- Handle `onDrop` for adding new nodes from the action palette sidebar
- Handle `onNodeClick` to open the config panel for that step
- Include `<MiniMap>` in bottom-right corner
- Include `<Controls>` in bottom-left corner
- Include `<Background variant="dots">` for grid pattern
- Dark theme: set `colorMode="dark"` or style the wrapper with dark background
- Auto-layout on initial load using dagre (top-to-bottom direction)
- Fit view on load: `fitView` prop

### 6F. Steps ↔ Nodes/Edges Conversion

The existing DB stores steps as a flat ordered list (by `position`). The canvas needs nodes (with x,y positions) and edges (connections).

converters.ts must handle:

stepsToNodesAndEdges(steps, trigger):

1. Create Trigger node at position (0, 0)
2. For each step, create a node with incrementing y position
3. For condition steps, create TWO outgoing edges with labels
4. For sequential steps, create a single edge to the next step
5. Create End node after the last step
6. If step has `position_x` and `position_y` in config (new fields), use those; otherwise auto-layout

nodesToSteps(nodes, edges):

1. Traverse the graph starting from the trigger node
2. Build the ordered steps array based on edge connections
3. Store each node's x,y position in the step's config for persistence
4. Handle branching: condition nodes produce branch metadata

### 6G. Auto-Layout (dagre)

Install dagre for automatic graph layout:

```bash
pnpm add @dagrejs/dagre
```

Use dagre to compute initial node positions:

- Direction: 'TB' (top to bottom)
- Node separation: 50px
- Rank separation: 80px
- Apply layout on: initial load, after adding/removing nodes, on "auto-layout" button click

### 6H. Drag from Palette to Canvas

The action palette sidebar uses @dnd-kit. When a user drags an action from the palette and drops it on the canvas:

1. Detect drop event on the ReactFlow wrapper via `onDrop` and `onDragOver`
2. Get the screenToFlowPosition from ReactFlow instance
3. Create a new node at the drop position
4. Create a new workflow step (call addStep from the hook)
5. Auto-connect: if there's a selected node, create an edge from it to the new node

### 6I. Preserve Backward Compatibility

The existing `use-workflow-builder.ts` hook manages step CRUD via server actions. The canvas is a VIEW layer — it converts steps↔nodes for display and converts back on save. The hook's API DOES NOT CHANGE. This means:

- `addStep()`, `updateStep()`, `deleteStep()`, `reorderSteps()` still work
- The canvas calls these same functions
- Position data is stored in `action_config.position_x` and `action_config.position_y`
- Fallback: if no position data exists (old workflows), auto-layout with dagre

### 6J. Keep Old Builder as Fallback

DO NOT DELETE the old workflow-canvas.tsx and workflow-builder.tsx. Rename them to `workflow-canvas-legacy.tsx` and `workflow-builder-legacy.tsx`. Add a toggle in the workflow settings or a user preference to switch between canvas view and list view. The new canvas is the default, but the list view remains accessible.

---

## 7. PHASE 5 — MIGRATION SAFETY AND FALLBACK SYSTEM

### Goal

Safely transition from hardcoded notifications to automation-controlled without any notification gaps.

### 7A. The Automation-Aware Notification Wrapper

Create a new utility: `src/lib/notifications/automation-aware-dispatcher.ts`

```typescript
export async function dispatchNotification(params: {
  siteId: string;
  eventType: string; // e.g., 'booking.appointment.confirmed'
  notificationFunction: () => Promise<void>; // The original hardcoded function call
  payload: Record<string, unknown>;
}): Promise<void>;
```

Logic:

1. Check if an active automation workflow exists for this `siteId` + `eventType`
2. If YES → the automation engine will handle it (the event was already emitted). Skip the hardcoded call.
3. If NO → call the original `notificationFunction()` as fallback
4. If check FAILS (database error) → call the original function as fallback (fail-safe)

Implementation detail — the check query:

```sql
SELECT COUNT(*) FROM automation_event_subscriptions aes
JOIN automation_workflows aw ON aes.workflow_id = aw.id
WHERE aes.site_id = $1
  AND aes.event_type = $2
  AND aes.is_active = true
  AND aw.is_active = true
  AND (aw.tags @> ARRAY['system']::text[] OR aw.category LIKE 'system-%')
```

If count > 0, the automation handles it. Otherwise, fallback.

### 7B. Replace All Hardcoded Calls

After the wrapper is created, go to EVERY hardcoded notification call site (listed in Section 2) and wrap it:

BEFORE:

```typescript
await notifyBookingConfirmed(siteId, data);
```

AFTER:

```typescript
await dispatchNotification({
  siteId,
  eventType: "booking.appointment.confirmed",
  notificationFunction: () => notifyBookingConfirmed(siteId, data),
  payload: { ...data },
});
```

The event emission (logAutomationEvent) happens BEFORE this — so if automation handles it, the wrapper skips the hardcoded call. If no automation exists, the hardcoded call fires as before.

### 7C. Chat Event Bridge Wrapper

Same pattern for chat messages. Create:

```typescript
export async function dispatchChatNotification(params: {
  siteId: string;
  eventType: string;
  chatFunction: () => Promise<void>;
}): Promise<void>;
```

Same logic — check if an automation workflow with a `chat.send_system_message` action exists for this event. If yes, skip. If no, call the original function.

### 7D. Migration Safety Rules

CRITICAL: Do these in order:

1. First, add all event emissions (Phase 1) — this is safe, it's additive
2. Then, create all system workflow templates (Phase 2) — this is safe, templates are just data
3. Then, create the packs and auto-install logic (Phase 3) — this is safe, workflows start inactive for existing sites
4. Then, create the dispatch wrapper (Phase 5A)
5. Then, wrap ONE module's notifications at a time (e.g., booking first)
6. Test that module thoroughly
7. Then wrap the next module (e-commerce)
8. Test again
9. Then wrap quotes, forms, chat
10. The canvas (Phase 4) is independent and can happen in parallel with any phase

NEVER delete the hardcoded notification functions. They remain as fallback code.

---

## 8. PHASE 6 — TESTING AND VERIFICATION

### 8A. TypeScript Verification

After every phase, run:

```bash
cd next-platform-dashboard
npx tsc --noEmit
```

Must return 0 errors.

### 8B. Automation Engine Tests

For each system workflow template:

1. Install the pack on a test site
2. Verify all workflows are created and active
3. Trigger each event manually (via Supabase or the test site)
4. Check workflow_executions table — status must be 'completed'
5. Check step_execution_logs — all steps must show 'completed'
6. Verify the ACTUAL notification was sent (email received, chat message appears, in-app notification visible)

### 8C. Fallback Tests

1. Deactivate a system workflow
2. Trigger the corresponding event
3. Verify the hardcoded fallback fires (email still sent)
4. Re-activate the workflow
5. Trigger again
6. Verify only the automation version fires (no duplicate)

### 8D. Canvas Tests

1. Open an existing workflow in the canvas
2. Verify nodes and edges render correctly
3. Drag a new action from the palette
4. Connect it to an existing node
5. Configure the action
6. Save — verify steps are persisted in DB
7. Reload — verify positions are preserved
8. Test auto-layout button
9. Test minimap navigation
10. Test zoom/pan
11. Test condition branching (True/False edges)
12. Test deleting a node (verify edges update)

### 8E. Pack Auto-Install Tests

1. Create a new site via the dashboard
2. Verify 'essential-communications' pack workflows exist in the automation tab
3. Install the booking module on that site
4. Verify 'booking-communications' pack workflows appear automatically
5. Install the ecommerce module
6. Verify 'ecommerce-communications' pack workflows appear
7. Check all system workflows are active (is_active: true)

---

## 9. DATABASE SCHEMA CHANGES

### 9A. Workflow Table — Add System Metadata

```sql
ALTER TABLE automation_workflows
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pack_id TEXT,
  ADD COLUMN IF NOT EXISTS system_event_type TEXT;

CREATE INDEX IF NOT EXISTS idx_workflows_system
  ON automation_workflows(site_id, is_system)
  WHERE is_system = TRUE;

CREATE INDEX IF NOT EXISTS idx_workflows_pack
  ON automation_workflows(site_id, pack_id)
  WHERE pack_id IS NOT NULL;
```

### 9B. Workflow Steps — Add Position Data

```sql
ALTER TABLE workflow_steps
  ADD COLUMN IF NOT EXISTS position_x REAL,
  ADD COLUMN IF NOT EXISTS position_y REAL;
```

### 9C. Installed Packs Tracking

```sql
CREATE TABLE IF NOT EXISTS automation_installed_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  pack_id TEXT NOT NULL,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  installed_by UUID,
  UNIQUE(site_id, pack_id)
);
```

### 9D. Event Subscription — Add System Flag

```sql
ALTER TABLE automation_event_subscriptions
  ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;
```

This prevents users from accidentally deleting subscriptions that back system workflows.

---

## 10. FILE-BY-FILE IMPLEMENTATION MAP

### New Files to Create

| File                                                                      | Purpose                                                     |
| ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| src/modules/automation/lib/starter-packs.ts                               | Pack definitions, getPacksForModules(), getAvailablePacks() |
| src/modules/automation/components/canvas/AutomationCanvas.tsx             | Main ReactFlow canvas                                       |
| src/modules/automation/components/canvas/CanvasControls.tsx               | Zoom, fit, minimap toggles                                  |
| src/modules/automation/components/canvas/CanvasSidebar.tsx                | Action palette for drag-to-canvas                           |
| src/modules/automation/components/canvas/nodes/TriggerNode.tsx            | Trigger start node                                          |
| src/modules/automation/components/canvas/nodes/ActionNode.tsx             | Action step node                                            |
| src/modules/automation/components/canvas/nodes/ConditionNode.tsx          | Branching condition node                                    |
| src/modules/automation/components/canvas/nodes/DelayNode.tsx              | Delay/wait node                                             |
| src/modules/automation/components/canvas/nodes/LoopNode.tsx               | Loop iteration node                                         |
| src/modules/automation/components/canvas/nodes/EndNode.tsx                | Terminal end node                                           |
| src/modules/automation/components/canvas/nodes/NoteNode.tsx               | Documentation sticky note                                   |
| src/modules/automation/components/canvas/edges/DefaultEdge.tsx            | Standard connection edge                                    |
| src/modules/automation/components/canvas/edges/LoopbackEdge.tsx           | Loop-back edge                                              |
| src/modules/automation/components/canvas/panels/NodeConfigPanel.tsx       | Node configuration sidebar                                  |
| src/modules/automation/components/canvas/panels/TriggerConfigPanel.tsx    | Trigger settings                                            |
| src/modules/automation/components/canvas/panels/WorkflowSettingsPanel.tsx | Workflow metadata                                           |
| src/modules/automation/components/canvas/utils/layout.ts                  | Dagre auto-layout                                           |
| src/modules/automation/components/canvas/utils/converters.ts              | Steps↔Nodes conversion                                      |
| src/modules/automation/components/canvas/utils/validation.ts              | Graph validation                                            |
| src/modules/automation/components/pack-gallery.tsx                        | Pack browsing and installation UI                           |
| src/lib/notifications/automation-aware-dispatcher.ts                      | Fallback wrapper                                            |

### Files to Modify

| File                                                                    | Changes                                                                                                                                                                            |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| src/lib/actions/sites.ts                                                | Add auto-pack installation after automation module install. Add hook for module installation on existing sites.                                                                    |
| src/modules/automation/lib/templates.ts                                 | Add ~30 system workflow templates with isSystem, systemEventType, defaultActive, pack fields                                                                                       |
| src/modules/automation/lib/action-types.ts                              | Add email.send_branded_template, chat.send_system_message, notification.in_app_targeted action definitions                                                                         |
| src/modules/automation/lib/event-types.ts                               | Add all missing event types that are being emitted                                                                                                                                 |
| src/modules/automation/services/action-executor.ts                      | Add email.send_branded_template execution (calls sendBrandedEmail), chat.send_system_message execution (calls resolveChatMessage + insert), notification.in_app_targeted execution |
| src/modules/automation/services/event-processor.ts                      | No changes needed — already handles events correctly                                                                                                                               |
| src/modules/automation/services/execution-engine.ts                     | No changes needed                                                                                                                                                                  |
| src/modules/automation/actions/automation-actions.ts                    | Add installStarterPack(), getInstalledPacks(), uninstallPack() server actions                                                                                                      |
| src/modules/automation/components/template-gallery.tsx                  | Add pack gallery section above templates, add "System" badges                                                                                                                      |
| src/modules/automation/components/workflow-builder/workflow-builder.tsx | Replace canvas section with AutomationCanvas, add canvas/list toggle                                                                                                               |
| src/modules/automation/types/automation-types.ts                        | Add StarterPack, PackInstallation, SystemWorkflowMetadata types, update WorkflowStep with position_x/y                                                                             |
| src/modules/automation/hooks/use-workflow-builder.ts                    | Add node position persistence in step config                                                                                                                                       |
| src/modules/booking/actions/booking-actions.ts                          | Add missing event emissions + wrap notifications with dispatchNotification                                                                                                         |
| src/modules/booking/actions/public-booking-actions.ts                   | Add missing event emissions                                                                                                                                                        |
| src/modules/live-chat/actions/chat-booking-actions.ts                   | Add missing event emissions + wrap notifications                                                                                                                                   |
| src/modules/ecommerce/actions/ecommerce-actions.ts                      | Add missing event emissions + wrap notifications                                                                                                                                   |
| src/modules/ecommerce/actions/order-actions.ts                          | Wrap notifications                                                                                                                                                                 |
| src/modules/ecommerce/actions/public-ecommerce-actions.ts               | Add missing event emissions + wrap notifications                                                                                                                                   |
| src/modules/ecommerce/actions/quote-actions.ts                          | Add event emissions + wrap notifications                                                                                                                                           |
| src/modules/ecommerce/actions/quote-workflow-actions.ts                 | Add event emissions + wrap notifications                                                                                                                                           |
| src/app/api/modules/ecommerce/webhooks/payment/route.ts                 | Add event emissions + wrap notifications                                                                                                                                           |
| src/app/api/forms/submit/route.ts                                       | Add event emission                                                                                                                                                                 |
| src/modules/live-chat/lib/chat-notifications.ts                         | Wrap with dispatchChatNotification                                                                                                                                                 |
| src/modules/live-chat/lib/chat-event-bridge.ts                          | Wrap with dispatchChatNotification                                                                                                                                                 |

### Files to Rename (NOT Delete)

| Old Path                             | New Path                                    |
| ------------------------------------ | ------------------------------------------- |
| workflow-builder/workflow-canvas.tsx | workflow-builder/workflow-canvas-legacy.tsx |

### NPM Packages to Install

```bash
pnpm add @xyflow/react @dagrejs/dagre
pnpm add -D @types/dagre  # (if needed — check if @dagrejs/dagre includes types)
```

---

## 11. BUSINESS TYPES AND PACK DEFINITIONS

### Pack-to-Module Mapping

| Installed Modules                     | Auto-Installed Packs        |
| ------------------------------------- | --------------------------- |
| CRM + Automation + Live Chat (always) | Essential Communications    |
| + Booking                             | + Booking Communications    |
| + E-Commerce                          | + E-Commerce Communications |
| + Booking + E-Commerce                | + Both above                |

### User-Installable Packs (all businesses)

| Pack              | Best For                                          | Templates Count |
| ----------------- | ------------------------------------------------- | --------------- |
| Booking Growth    | Service businesses (salons, clinics, consultants) | 5 templates     |
| E-Commerce Growth | Online stores, product sellers                    | 7 templates     |
| Lead Generation   | Any business doing marketing                      | 6 templates     |
| Customer Success  | Service-focused businesses                        | 4 templates     |

### What Users Can Customize

When a system workflow is installed, users can:

- Edit the email subject/body (via the email template action config)
- Change delays (e.g., reminder from 24h to 12h)
- Add extra steps (e.g., add a Slack notification after a booking)
- Add conditions (e.g., only send if order > $100)
- Disable individual steps (toggle is_active on the step)
- Disable the entire workflow (toggle is_active on the workflow — fallback fires)
- They CANNOT delete system workflows — only disable them

### Template Editability in the Canvas

When a user opens a system workflow in the canvas:

- All nodes are editable (can change action config)
- All nodes can be deleted (step is_active → false, not actually removed)
- New nodes can be added between existing ones
- Edges can be rerouted
- A "Reset to Default" button restores the original template configuration

---

## IMPLEMENTATION ORDER (CRITICAL — FOLLOW THIS EXACTLY)

1. Phase 1 (Event Emissions) — Add all missing logAutomationEvent calls. This is purely additive and cannot break anything.
2. Phase 2 (System Templates) — Add system workflow templates to templates.ts. Add new action types (email.send_branded_template, chat.send_system_message, notification.in_app_targeted). This is data + new code only.
3. Phase 3 (Starter Packs) — Create pack definitions, server actions, UI. Hook into site creation. This creates workflows but doesn't change notification flow.
4. Phase 5 (Fallback Wrapper) — Create dispatchNotification wrapper. Wrap booking module first. Test. Then ecommerce. Test. Then quotes, forms, chat.
5. Phase 4 (Canvas) — Independent of notification migration. Can be built in parallel with Phases 1-3 if desired.
6. Phase 6 (Testing) — After each phase, verify TypeScript, test the affected module, confirm no notification gaps.

RUN `npx tsc --noEmit` AFTER EVERY FILE CHANGE. Fix errors before proceeding.

---

## CRITICAL WARNINGS

1. NEVER delete hardcoded notification functions. They are the fallback safety net.
2. NEVER activate system workflows on EXISTING sites automatically. Only on NEW sites. Existing sites get them installed as inactive — the user can activate when ready.
3. NEVER emit an event AND call the hardcoded notification for the same thing UNLESS the dispatch wrapper confirms no automation handles it.
4. The event emission MUST happen BEFORE the dispatch wrapper check, so the automation engine has time to receive it.
5. The dispatch wrapper check uses a DB query. Cache the result for 60 seconds per siteId+eventType to avoid hammering the database.
6. When the canvas saves node positions, ensure the position data is stored in the step record ALONGSIDE the existing action_config, not inside it — use the dedicated position_x/position_y columns.
7. System workflows use the `tags` array with `['system']` tag AND `is_system: true` column for double-identification.
8. ReactFlow MUST use "use client" directive. The canvas component cannot be a server component.
9. Import ReactFlow CSS: `import '@xyflow/react/dist/style.css'` — this is REQUIRED for proper rendering.
10. All Supabase queries on automation tables use `as never` cast pattern because these tables are not in the generated types.

---

## SUCCESS CRITERIA

When this overhaul is complete:

1. Every customer-facing email, chat message, and notification is generated by an automation workflow
2. Users can find, edit, and customize every notification from the automation UI
3. The canvas provides a professional drag-and-drop workflow editing experience
4. New sites automatically get the right communication workflows based on their installed modules
5. Disabling a system workflow causes the hardcoded fallback to fire — zero notification gaps
6. The platform passes `npx tsc --noEmit` with 0 errors
7. All changes are committed and pushed to origin/main
