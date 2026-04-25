# DRAMAC Client Portal — Perfection Prompt for AI Engineering Agent

> This document is the single authoritative prompt to hand to an autonomous coding agent. The agent's job is to take the DRAMAC CMS client portal from "mostly working" to "industry-leading, production-perfect" in one sustained pass. The document is intentionally written as prose so the agent is free to explore, improvise, and go further than the explicit items when it sees an opportunity to make things better. Do not treat any section as a ceiling. Treat each section as the minimum bar.

---

## 0. Read this before you touch any code

You are working inside a Next.js 16 App Router monorepo. The platform root is `d:\dramac-cms`. The portal application lives inside `d:\dramac-cms\next-platform-dashboard`. The database is Supabase project `nfirsqmyxmmtbignofgb` and you have MCP tools that can query it, apply migrations, and read logs directly. You also have Vercel MCP for deployment checks and Context7 for library documentation. Prefer those tools over asking the human to do anything manually.

Before you write a single line, read the full memory bank at `memory-bank/activeContext.md`, `memory-bank/progress.md`, `memory-bank/systemPatterns.md`, and `memory-bank/techContext.md`. Skim the repo-scoped notes under `/memories/repo/` especially the ones about the portal, live chat, automation, recurring invoices, and theming. If something in this prompt contradicts the memory bank, trust the memory bank and update this prompt. If something in this prompt contradicts the code, trust the code and update this prompt.

The platform is multi-tenant: Platform owns Agencies, Agencies own Clients, Clients own Sites, Sites host Modules (CRM, Live Chat, E-Commerce, Booking, Invoicing, Marketing, Automation, Blog, Media, SEO, Forms, Domains, Business Email, Apps, Communications). A portal user is a human who belongs to one client and can see only that client's sites. Everything you do must respect that boundary. If you are ever tempted to bypass tenancy for convenience, stop and find another way.

The portal has just been through two recent fixes. Session 9 Part A moved the magic-link verifier from a Server Component to a Route Handler so session cookies can actually be written to the browser. Session 9 Part B extended the Postgres function `can_access_site(uuid)` so portal users are admitted through Row Level Security for their own client's sites. The second fix is applied directly to production and recorded in `migrations/portal-user-can-access-site.sql`. Read both of those before you assume anything about the auth or data layer. The RLS fix unblocks reads but does not fix every rendering bug — the Live Chat list being empty while the count card says three conversations is the clearest sign that there is also a component-level bug waiting for you.

You have unlimited time. The human has explicitly said you may take days or weeks. Do not rush. Ship nothing you have not tested end to end against the production Supabase project through the MCP tools or against a real browser session. Commit in small, reversible, well-described chunks on the `main` branch. Update the memory bank after every meaningful session so the next agent can resume.

---

## 1. The mental model you must keep in your head at all times

A portal user signs in at `/portal/login`, either with a password or with a magic link that arrives by email. The magic link lands on `/portal/verify` which is a Route Handler that exchanges the hashed token for a Supabase session, sets all session cookies on a redirect response, and lands them on `/portal`. The portal shell (`src/app/portal/layout.tsx`) resolves their agency branding, their client, their sites, and their effective permissions, and wraps everything in the `PortalProvider` plus a `ServerBrandingStyle` that injects CSS variables so the whole experience is themed before hydration. From there every page under `/portal/sites/[siteId]/...` calls `requirePortalAuth()`, then `verifyPortalModuleAccess(user, siteId, moduleSlug, permissionKey)`, and only then renders.

Data is read either through the portal DAL (`src/lib/portal/data-access.ts` and its siblings) which uses an admin Supabase client scoped at query time by explicit `site_id` and `client_id` filters plus permission checks, or through agency server actions which use the cookie-based Supabase client and rely on RLS to scope the query. Both paths are valid. The DAL path is preferred because it is explicit and testable. The RLS path is pragmatic because it reuses agency UIs. Both paths are now secure because `can_access_site()` admits portal users correctly.

Writes go through module-specific server actions. Those actions fire automation events through `logAutomationEvent`, send branded email through `sendBrandedEmail`, dispatch in-app notifications through `dispatchNotification`, dispatch web push through the push dispatcher, and log every side effect to `portal_send_log` for auditing. The rule you must never forget: when any customer-facing thing changes — a booking is made, an order ships, an invoice is sent, a status transitions, a payment is received, a refund is issued, a chat message arrives — three things must happen together. The right people must get an in-app notification, the right people must get a branded email, and the portal user must get a web push or desktop notification if they are eligible for one. Miss any of the three and the experience is broken.

Keep one more picture in your head. The customer of the DRAMAC platform is the agency. The customer of the agency is the client (the business owner). The customer of the client is the end user (the shopper, the spa visitor, the quote requester, the chat visitor). Every email and every chat message must feel like it came from the client's brand, never from the agency and never from DRAMAC. Branding flows down: agency sets defaults, site overrides them for customer-facing surfaces. If a customer confirmation email goes out saying "From: DRAMAC Agency" instead of "From: Lumina Wellness" that is a severity-one bug.

---

## 2. The single most important bug you are fixing right now

The Live Chat list is empty for portal users even though the header card announces three conversations. That means the count query and the list query do not share the same path. Find both. The count probably comes from a small aggregate in `getPortalDashboardData()` or a header widget that uses the admin client; the list almost certainly comes from a wrapper component that either passes the wrong argument to the data call, shadows the filter, or renders before hydration completes.

The file that mounts the list is `src/modules/live-chat/components/wrappers/ConversationsPageWrapper.tsx`. Read it top to bottom. Read the server action it calls (`getConversations` or `listConversationsForSite` — follow the import). Read the Postgres query that action issues. Confirm on the live database through the Supabase MCP that for the portal test user (auth user `4be3ebeb-c1a5-4c7e-9210-3f0ba2733852`, client `7cdb79c0-59db-4ba3-abfb-901c0d2d852e`, site `b019cce4-35ff-4283-a032-6d87f56b9302`) the query used by the page returns rows. Run it both as the admin role and as the authenticated role with the JWT claim `sub` set to the portal user — if the admin returns three and the authenticated role returns zero then RLS on `mod_chat_conversations` (or more likely `mod_chat_messages` used to compute "last message") still has a policy that does not go through the updated `can_access_site()` function. If both return rows then the bug is in the wrapper: probably a stale React state, a hydration boundary, or a prop mismatch.

Once the list renders, click into a conversation. Verify the message thread loads. Verify the realtime channel `conversations:${siteId}` and any per-conversation channel actually attach and re-render on new messages. Verify canned responses appear on `/`. Verify the visitor info panel shows the right customer, order, and booking data. Verify status changes fire the branded customer email and fire the portal in-app notification and fire the web push. Verify internal notes stay internal and never leak to any AI prompt, any email, any notification, any webhook.

Do not stop at "it looks right". Send yourself a chat through the embeddable widget, answer it from the portal, change the status to resolved, close the browser, open the push notification on the desktop, land back in the conversation, and confirm the loop is seamless.

---

## 3. Fallback chat flows for when Chiko AI credits are exhausted

The AI responder in `src/modules/live-chat/lib/ai-responder.ts` currently calls Claude unconditionally when `ANTHROPIC_API_KEY` is present. When a client has exhausted their monthly AI quota, or the agency has paused AI for the site, or Anthropic is throwing a quota error, the call fails silently and the conversation dies on the vine. Fix this with a proper fallback system.

Add a credit check at the top of the AI responder. Use the existing `usageTracker.checkUsageLimit(agencyId, 'ai_actions')` pattern that the portal Chiko API already uses. If the check denies, or if the Anthropic call returns a quota or rate-limit error, do not ask Claude anything. Instead, enter a deterministic fallback mode. The fallback must be smart enough to feel helpful, must never pretend to be AI, must never invent information about the business, and must always route to a human if the visitor asks for one.

The fallback flow works like this. The system keeps a library of agent-approved scripted responses stored per site. Each response is a small decision tree: a trigger (keywords, intents, or the visitor tapping a button), an optional question to the visitor with preset answer buttons, and a response body that can include merge fields drawn from the site's data (business name, business hours, location, list of payment methods, refund policy, shipping policy, delivery times, common FAQ answers). The agent designs the tree in an editor that lives inside the Live Chat module under a new tab called "Scripted Flows" (or similar; you pick the name and keep it consistent).

The canonical flow the human asked for by name is the payment-methods flow. A visitor says something like "how do I pay" or "payment options" or taps a "Payment methods" button. The fallback matches the trigger, replies with a short friendly sentence followed by a list of payment-method buttons pulled from the site's configured payment methods table. When the visitor taps a method — Bank Transfer, Mobile Money, Card, PayPal, Cash on Delivery, whatever the business has configured — the fallback sends the next scripted message which contains the account name, account number, reference format, and upload-proof call-to-action. This already partially exists as `payment_method_select` content type; wire it fully and make it usable without any AI call. Do the same for appointment-booking confirmation, order-status check, business-hours check, location request, refund request, and talk-to-a-human handoff. Think of these as the ten scripted flows every small business needs. Ship all ten on day one and let the agency customise them per client.

Every scripted response that the system proposes to send must pass through an agent-approval gate unless the agency has explicitly flipped a per-site setting called "Send scripted replies without approval". Default: approval required. The agent sees the proposed reply in the conversation view, exactly like the current AI suggestion approval path, and can approve as-is, edit, or discard. When the agency toggles approval off for a trusted client, scripted replies can go straight out because they are deterministic and pre-written. Never let AI-generated text go out without approval. That distinction matters because scripted replies are the client's own words while AI-generated replies are Chiko's words.

Design the fallback so it works for any niche. A spa uses the booking confirmation flow. An e-commerce store uses the order-status flow. A law firm uses the business-hours and consultation-request flow. The library of flows must be editable from the portal by anyone with `canManageLiveChat` permission. Store them in a new table `mod_chat_scripted_flows` keyed by `site_id`, each row holding `slug`, `name`, `trigger_keywords[]`, `is_enabled`, `requires_approval`, `steps jsonb` (ordered list of steps each with `type: question | message | button_group | payment_methods | handoff`, plus content and merge fields). Migrate it through an SQL file in `migrations/` and apply it through the Supabase MCP. Backfill default flows for every existing site so the feature lights up immediately.

Make the visitor experience buttery. When the visitor taps a button, the click must send a message back to the conversation representing their selection, the next step must appear within a second, and the agent must see both messages in real time. When the scripted tree ends, the bot must gracefully offer either "Talk to a human" or "Start over" and both must work.

One more thing on this topic. When AI credits come back online, the system must not silently switch back to AI mid-conversation. It must finish the current scripted flow and only return to AI for the next unrelated message. Agents hate when a conversation changes personality halfway through and customers hate it even more.

---

## 4. Notifications that never get missed

Notifications on this platform must be best-in-class. That means three surfaces working together: in-app, email, and push. In-app is the bell in the portal header and the `/portal/notifications` inbox. Email is a branded message from the client's brand not the agency's. Push is a web push notification that on desktop appears as a native OS banner (Windows toast, macOS banner, Linux notification) indistinguishable from an installed app and on mobile appears on the lock screen exactly like WhatsApp, Gmail, or Shopify.

Start by creating `public/manifest.json` so the portal is installable as a PWA. Include the portal name, a short name, a start URL of `/portal`, display `standalone`, background and theme colours drawn from the default brand (but know that per-client branding cannot be baked in because the manifest is static; use sensible neutral values), the full range of icons at 48, 72, 96, 128, 144, 192, 256, 384, 512 pixels, at least two screenshots for Android install prompts, shortcuts for Orders, Live Chat, Bookings, and a proper `display_override` of `["window-controls-overlay", "standalone"]` so desktop installs feel native. Link it from `src/app/portal/layout.tsx` metadata. Add the Apple equivalents too: `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, the appropriate touch-icon link tags.

Next, the service worker. A service worker is probably already registered under `public/sw.js`. Open it and audit. It must handle four event types correctly: install (precache the portal shell), activate (claim clients and clean old caches), fetch (network-first for API, cache-first for static, stale-while-revalidate for fonts and images, never cache authenticated HTML), and push. The push handler is the one you will touch most. When a push arrives it must parse the payload, derive a tag scoped per user so the same event does not notify twice across two tabs, pick the right icon and badge, set `requireInteraction: true` for critical events (new order, new booking, status changes), and set `renotify: true` when an update supersedes an earlier notification. On click, it must focus an existing portal tab if one exists and navigate it to the notification's deep link; only open a new tab when none is open. Include an actions array when it makes sense — "View order", "Reply to chat", "Approve quote" — and wire each action in the handler.

On the server side, read `src/lib/portal/notification-dispatcher.ts` end to end. Verify that every business event funnels through it, that every event computes recipients by joining client portal users with their permission flags, that every event consults `portal_notification_preferences` before sending, that every event respects site-level channel toggles, that every event writes a `portal_send_log` row, and that the dedupe key is stable enough to survive retries. Then audit every place in the code that should be calling the dispatcher and confirm it does. The must-fire list at minimum: order created, order confirmed, order shipped, order delivered, order cancelled, order refunded, order payment received, order payment proof uploaded, booking created, booking confirmed, booking cancelled, booking completed, booking rescheduled, booking no-show, invoice sent, invoice viewed, invoice paid, invoice overdue, quote requested, quote sent, quote accepted, quote rejected, quote amendment requested, chat message from visitor, chat conversation assigned, chat status changed, form submission received, contact created in CRM, deal stage changed, site published, domain verified, email inbox warning, push subscription expired, AI credits low, plan usage at 80%, plan usage at 100%, support ticket created, support ticket replied. If any of those is missing, add it. Keep the event names stable and match the automation system template names.

Build the permission flow for enabling push the right way. On first login after the Session 9 fixes, show a non-blocking banner at the top of the portal explaining that notifications are off and inviting the user to turn them on. One tap triggers `Notification.requestPermission()` and on grant registers a subscription against the portal push endpoint. Never prompt the native permission without the explanation banner in front of it — browsers increasingly punish sites that do and will hide the prompt permanently. If the user dismisses the banner, store the dismissal and do not re-prompt for 30 days. If the user denies, show a quieter re-enable affordance in `/portal/settings/notifications`.

Test push end to end on Chrome Windows, Edge Windows, Chrome macOS, Safari iOS 16.4+ (PWA home-screen install required for iOS push), and Android Chrome. Confirm the OS banner shows the client's brand logo if available (the notification `icon` field), the right title, the right body, and the right click-through deep link. Confirm that closing the portal tab does not silence pushes. Confirm that force-quitting the browser on desktop does not silence pushes as long as the browser process is restarted (standard behaviour, document it).

On desktop especially, the bar the user set is "a popup from the desktop comes and visibly shows as if it's coming from an application". Meet that bar by installing the PWA, giving it its own taskbar icon, setting the manifest `display` to `standalone`, using `Notification` (not just in-app toast) with a custom icon and actions, and confirming the popup appears even when the browser window is minimised. Verify the notification sound plays (browsers handle this automatically, but some OS settings mute it; add a visible one-click "Test notification" button in `/portal/settings/notifications` so users can confirm).

For mobile, once the PWA is installed, confirm push behaves like WhatsApp: a lock-screen banner, a vibration, and a badge on the app icon when possible. Verify grouping so the user sees "3 new orders" not three separate banners within a few seconds of each other. Use `Notification.tag` and `Notification.renotify` sensibly.

Do not forget the in-app layer. The bell in the header must show the unread count with sub-second latency after a new event. Subscribe the header to the Supabase realtime channel for `portal_in_app_notifications` filtered by `user_id`. On new row, increment unread and show a subtle toast. On click, mark read and navigate to the notification's deep link. On the full `/portal/notifications` page, group by date, support filtering by type, support bulk mark-all-read, and support archive. Accessibility matters here: every icon-only button needs an `aria-label`.

---

## 5. Email that is always branded, always delivered, always audited

Email is handled by `src/lib/email/send-branded-email.ts`. It already resolves agency branding, overlays site-level branding for customer-facing emails, renders the template, and sends through Resend with a bounded retry. Your job is to confirm every email type is wired and every event actually sends.

For each of the events listed in section 4, follow the code path from the action that fires it to the `sendBrandedEmail` call. Confirm the `emailType` matches a real template in `branded-templates.ts`. Confirm the `siteId` is passed when the recipient is a customer of the site and omitted when the recipient is the agency owner (so agency emails use agency branding, customer emails use site branding). Confirm the `data` payload contains every merge field the template references. Confirm the template's HTML renders cleanly in Gmail, Outlook, Apple Mail, and a mobile inbox; use a tool like Litmus or at least send yourself the five most important templates and screenshot them in each client.

Add a "Send test email" button to `/portal/settings/notifications` so clients can prove their branding is right without triggering a real event. Include a template selector so they can test the most important transactional emails (order confirmation, booking confirmation, invoice sent, quote sent, welcome, password reset). Render the test using their own site's branding. Store a short history of test sends keyed by user so they can see what they sent and when.

Build an email log viewer in the portal under `/portal/sites/[siteId]/communications` if it does not already exist, or beef up the one that does. Show the last 90 days of emails for that site, group by recipient, show template, subject, send time, Resend status, open/click if available, and a "Resend" button for failures. This already partially exists as the Communications module; finish it.

Review email deliverability hygiene. Confirm SPF and DKIM are set for the sending domain in Resend. Confirm every email includes an unsubscribe link where legally required. Confirm the plain-text alternative is not empty. Confirm the subject line does not exceed 78 characters. Confirm links are absolute and use HTTPS. Confirm no inline scripts, no web fonts referenced via `@import`, no CSS `position: fixed`, no background images that break in Outlook.

On failure handling, the retry already covers transient errors. Add a dead-letter path: after three failed attempts, log to a `email_failures` table, surface in the agency admin under a new "Email health" page, and optionally alert the agency owner by in-app notification when more than five failures land within an hour. The portal user should also be informed gently if their notification email failed three times in a row ("We couldn't reach you at this address — please verify it").

---

## 6. Bookings, orders, status changes, and the automation module

Every customer-facing transition must fire an automation event. Open `src/modules/automation/lib/system-templates.ts` and confirm a template exists for every event in the must-fire list from section 4. For each template confirm it has at least these steps: `email.send_branded_template` for the customer, `email.send_branded_template` for the business owner (usually different email type), `notification.in_app_targeted` for the portal users with the relevant permission, `notification.push_targeted` for the same, and optionally `chat.send_system_message` if an active conversation exists for the resource.

Open `src/modules/booking/actions/booking-actions.ts` and for every writeable path — create, update, confirm, cancel, complete, reschedule, no-show, mark-paid — confirm it ends with a `logAutomationEvent` call, a `dispatchBusinessEvent` call, and the right branded email. Do the same for `src/modules/ecommerce/actions/**` and `src/modules/invoicing/actions/invoice-actions.ts`. Do the same for `src/modules/live-chat/actions/**` for status transitions. Do the same for CRM contact create/update because the audit flagged that event as missing. Do the same for form submission received. The pattern is identical everywhere: on a state change, emit.

Test the pipeline end to end. Create a booking from a public-facing site. Confirm the customer gets the confirmation email branded as the client's brand. Confirm the agency owner gets an internal notification email. Confirm every portal user for that client with `canManageBookings` gets an in-app notification and a push. Confirm an automation event appears in the event log. Confirm any custom workflow that the agency built for "new booking" triggers. Then change the booking status to confirmed and repeat the verification. Then cancel and repeat. Then complete and repeat. Do the same gauntlet for orders (create, confirm, ship, deliver, cancel, refund) and invoices (send, view, pay, overdue).

There is a risk in emitting duplicate events on retry. Every mutation that might emit an event should include an idempotency key derived from `(resource_type, resource_id, event_type, state_hash)` so that if the same state transition fires twice within a minute, only one fan-out happens. Implement that at the dispatcher level if it is not already there.

While you are in this area, confirm automation workflows can be authored from the portal, not just from the agency dashboard, for clients that have `canManageAutomation`. The portal has a page at `/portal/sites/[siteId]/automation` that mounts the agency workflow list component. Confirm the agency component is safe for portal mount: no cross-client data exposure, no agency-only settings leaking in, no actions that would let a portal user edit another client's workflows. If any concern exists, gate the create/edit functionality behind an explicit server-side permission re-check and forbid cross-site actions.

---

## 7. Agency-to-portal data flow: branding, permissions, impersonation

Open `src/app/portal/layout.tsx` and verify that for every portal request the layout resolves: the portal user's identity, their client, the client's agency, the agency's branding, the client's sites, the currently active site, the effective permissions for each site, and the session's impersonation state. Confirm branding is applied server-side through `ServerBrandingStyle` so the first paint is correctly themed; any flash of default theme is a bug. Confirm the logo shown in the portal header is the agency's logo, or the agency's white-label override, or the platform default — never the DRAMAC-internal logo unless the agency is unbranded.

Verify `getEffectivePermissions(clientId, siteId)` returns the merged client-level + site-level flags. Document the precedence in code comments and in the agency admin UI. The rule should be: site-level overrides client-level when the site-level value is non-null; client-level applies otherwise; unknown permissions default to false. Make sure the fourteen canonical permission flags exist everywhere the navigation and page gates check them. The list at minimum: `canViewAnalytics`, `canEditContent`, `canManageLiveChat`, `canManageOrders`, `canManageProducts`, `canManageBookings`, `canManageCrm`, `canManageAutomation`, `canManageQuotes`, `canManageAgents`, `canManageCustomers`, `canManageMarketing`, `canManageInvoices`, `canManageChatAgents`. Add any the portal navigation already references that are not in this list.

Impersonation deserves a hard look. When an agency admin impersonates a portal user to debug something, every action they take must be logged with both identities — the impersonator's user id and the impersonated user id — in an `impersonation_actions` audit table. Reads may be unlogged to avoid noise but writes must always be logged. The portal header already shows an impersonation banner; verify it is visible on every portal page, verify the "Stop impersonation" button works from any page, and verify that when impersonation ends the session cleanly returns the agency admin to the agency dashboard without any lingering portal cookies.

Confirm the site switcher in the portal header works on mobile (it is usually a dropdown; on small screens consider a bottom sheet). Confirm the active site is persisted via cookie so a deep link from an email lands on the intended site rather than the client's primary site when they have multiple. Confirm URLs like `/portal/sites/abc/orders` and a direct manual edit to `/portal/sites/def/orders` both work if the user owns both sites and both redirect to login if they do not.

---

## 8. A page-by-page checklist you must walk through in a real browser

For every page listed below, log in as a real portal user, look at every element on the page, click every button, fill every form, confirm every state. Do not just grep the code. You must see it in the browser.

Start at `/portal/login`. Submit the magic-link form. Confirm the email arrives within 30 seconds and is branded correctly. Click the link. Confirm you land on `/portal` fully authenticated. Log out. Log in again with password. Fail it on purpose and confirm the error banner shows. Use the forgot-password flow and confirm the reset email arrives. Use the reset link and confirm the password change works and signs you in.

Move to `/portal`. Look at every KPI card. Confirm every number matches the Supabase data. Click every "View all" link. Confirm the recent-activity panels for Sites, Orders, and Live Chat all show real data. Open the notification bell. Confirm unread count, confirm each notification has a working deep link, confirm "Mark all read" works, confirm the polling refreshes every 30 seconds. Open the user menu. Confirm settings, profile, theme switch, and logout all work.

Move to `/portal/sites`. Confirm the list of client's sites is correct. Click into one. Confirm it becomes the active site. Switch to another site via the header switcher. Confirm the URL changes and the active-site cookie updates.

Move to `/portal/sites/[siteId]/orders`. Confirm the list loads with the right data. Search for a known order number. Confirm filter by status works, by date works, by channel works. Sort by each column. Open an order. Confirm customer details, items, totals, status history, payment proof if any, timeline, notes, and action buttons all work. Change status to Processing; confirm customer email fires and in-app plus push fire. Change to Shipped; confirm the same. Change to Delivered; confirm the same. Issue a partial refund; confirm the refund flow works and the audit log captures it.

Move to `/portal/sites/[siteId]/products`. Confirm list. Open a product. Confirm variants, inventory, SEO fields, publish toggle, and delete all work. Create a new product end to end. Confirm it appears in the public catalog and the portal list simultaneously.

Move to `/portal/sites/[siteId]/customers`. Confirm list. Open a customer. Confirm orders, bookings, quotes, and conversations are all linked and loaded. Edit a customer. Delete a test customer. Confirm.

Move to `/portal/sites/[siteId]/bookings`. Confirm list, calendar view if present, and the new-booking action. Create a booking manually. Confirm the customer gets the confirmation email. Confirm status changes propagate. Confirm cancellation and rescheduling work.

Move to `/portal/sites/[siteId]/quotes`. Confirm list. Open a quote. Send a quote. Accept a quote as the customer via the public quote link. Confirm the quote-converted flow creates an order and fires all the right events.

Move to `/portal/sites/[siteId]/invoicing`. Confirm balance summary, recent invoices, aging. Open an invoice. Send it. Confirm customer receives the branded email with a PDF or link. Mark it paid. Confirm the payment-received flow fires. Visit `/invoicing/statements` and download a statement. Confirm the PDF is correct.

Move to `/portal/sites/[siteId]/payment-proofs`. Confirm the list of pending proofs. Approve one. Confirm the order progresses. Reject one. Confirm the customer is notified. Confirm the audit trail captures both.

Move to `/portal/sites/[siteId]/crm`. Confirm contacts, companies, deals, activities, pipelines, segments. Create a contact. Convert it to a deal. Move the deal across pipeline stages. Confirm each stage change fires the right event.

Move to `/portal/sites/[siteId]/live-chat`. Confirm the list is not empty. Open a conversation. Reply. Assign. Resolve. Close. Reopen. Use a canned response via `/`. Let an AI suggestion appear; approve it; edit it then approve; discard one. Trigger the payment-methods scripted flow. Trigger the handoff keyword. Open the widget on a public site, send a message in, answer from the portal, confirm realtime on both sides.

Move to `/portal/sites/[siteId]/marketing`. Confirm landing pages. Create one. Publish it. Confirm the public URL renders. Visit the social sub-page. Schedule a post. Confirm it lands.

Move to `/portal/sites/[siteId]/automation`. Confirm the workflow list. Create a workflow. Enable it. Trigger its event. Confirm every step fires. Disable it. Delete it.

Move to `/portal/sites/[siteId]/blog`. Confirm posts, categories, tags. Create a post with a cover image and SEO fields. Publish. Confirm the public blog renders.

Move to `/portal/sites/[siteId]/media`. Confirm upload works, thumbnails render, folders work, delete works, and storage quotas display.

Move to `/portal/sites/[siteId]/seo`. Confirm titles, descriptions, Open Graph, Twitter cards, robots, sitemap link, schema settings.

Move to `/portal/sites/[siteId]/forms`. If forms are managed here, confirm form listing, submissions, and export work. Submit the public form. Confirm the submission arrives in the portal list and the form-submission event fires.

Move to `/portal/sites/[siteId]/submissions`. Confirm list. Mark items read. Reply to a submission if that action exists. Export to CSV.

Move to `/portal/sites/[siteId]/pages`. Confirm the page manager. Publish/unpublish a page. Confirm the public site updates.

Move to `/portal/sites/[siteId]/chat-agents` or wherever AI chat agents are managed per site. Confirm agent creation, knowledge base upload, training, and preview.

Move to `/portal/sites/[siteId]/communications`. Confirm the send log viewer. Filter by type. Drill into a failed send. Resend.

Move to `/portal/sites/[siteId]/apps`. Confirm the installed-modules catalog. Install a missing module if the permission allows. Uninstall a trial module.

Move to `/portal/domains`. Confirm DNS status for the client's domains. Add a new domain. Verify. Link it to a site.

Move to `/portal/email`. Confirm business-email inbox if provisioned. Check quota, deliverability status, and any pending mailbox actions.

Move to `/portal/notifications`. Confirm history. Mark all read. Delete one. Confirm preferences page works with per-event per-channel toggles.

Move to `/portal/team`. Invite a team member. Accept the invite in another browser. Confirm the new user sees the right scope.

Move to `/portal/support`. Create a ticket. Reply to it. Close it. Confirm the agency admin receives the notification.

Move to `/portal/ask-chiko`. Ask three questions across categories: revenue last month, top-selling product, today's bookings. Confirm answers cite only the client's data. Trigger the no-credits fallback; confirm the graceful message.

If at any point during this walkthrough a page is slow, jarring, misaligned, missing a loading state, missing an empty state, missing an error state, or shows DRAMAC or agency branding instead of the client's, fix it right then.

---

## 9. UI and UX polish you are free to pursue

The human explicitly gave you latitude to improve things beyond the explicit list. Use it. Here are the opportunities that came out of the audit but you should find more.

Make every list page feel instant. Use React `Suspense` with skeletons that match the final layout so there is no layout shift. Preload the next page's data on hover over pagination controls. Cache list responses in memory for the session so a quick back-navigation is zero-latency. Use optimistic updates for status changes so the UI responds before the server confirms.

Make every empty state beautiful. No empty state should be a blank box. Each empty state should explain what the section is, why it is empty, and what action the user can take (usually a primary CTA). Illustrate with a small vector if you have one; otherwise an icon plus a sentence. The dashboard's "You have no orders yet" should tell the user how their customers can place orders and link to the public storefront.

Make every error state recoverable. No error message should be just "Something went wrong". Include a short human-readable description, a retry affordance, and a link to support. Log the correlation id so the user can quote it when they contact you.

Make navigation keyboard-first. `Tab` through every page and confirm focus rings are visible, focus order is logical, and no element is a trap. `Enter` should activate primary buttons everywhere. `Escape` should close modals everywhere. `Cmd/Ctrl+K` should open a global command palette that searches across all the client's data — orders, bookings, customers, products, contacts, pages, blog posts — and deep-links to the result. Build the palette if it does not exist; it is the single highest-leverage UX addition.

Make mobile not a second-class citizen. Every list page should have a card layout below `md`. Every form should use `inputMode` and `autocomplete` so keyboards behave. Every button should have a minimum 44 by 44 pixel touch target. The bottom nav should always be reachable. Swipe gestures should feel good.

Make everything accessible. `aria-label` on icon buttons, `aria-live` on toast containers, `role="status"` on skeletons, proper heading hierarchy (one `h1` per page), proper form label association, colour contrast at least AA across light and dark themes and across every agency's brand palette.

Make everything observable. Every major user action should emit a structured log line through `logPortalEvent` so the agency can audit. Every mutation should attribute to the right user and the right impersonator. Every error should be captured with Sentry or the equivalent already in the codebase.

Make themes exhaustive. The portal already pulls branding from the agency. Confirm dark mode works correctly with every agency palette including pathological ones (white-on-white, black-on-black, extreme hues). Confirm CSS variables are used consistently so a palette change recomputes the whole UI on the fly.

Think about onboarding. A brand new portal user who has never logged in before should see a checklist on the dashboard: confirm your profile, enable notifications, install the app, invite your team, review your first order, set up your payment methods. Each item is a one-click affordance that walks them through the relevant flow.

Add a "What's new" feed in the header, powered by a simple JSON file checked into the repo, so you can communicate platform changes to clients without sending an email.

---

## 10. Testing the work

Run the TypeScript compiler clean. From `next-platform-dashboard` run `npx tsc --noEmit`. Fix every error that touches portal code. Do not suppress with `@ts-ignore` or `@ts-expect-error`. If the error is in shared code, fix it there.

Run the Next.js build clean. `npx next build`. The build currently has `typescript.ignoreBuildErrors = true` which is a trap; turn it off locally while you work and only turn it back on before you push if absolutely necessary — aim to land all portal code with it off.

Run the existing portal test suites and add to them. Look under `src/lib/portal/__tests__` and write a new test for every bug you fix. In particular add tests for: the empty-list render path, the scripted-flow trigger matching, the scripted-flow payment-method rendering, the AI credit-exhaustion fallback, the notification dispatcher dedupe, the impersonation audit log, the site-level branding overlay on customer emails, the permission precedence (site-level over client-level), and the realtime reconnect behaviour after a network blip.

Run Playwright end-to-end. The repo has Playwright configured. Add two full journeys: the "new portal user" journey (receive magic link, land, click through every module, see real data) and the "incident response" journey (chat comes in, agent replies, status changes, customer gets branded email, portal user gets push, all within 10 seconds). Fail the suite if any of those break.

Run against real production through the Supabase MCP. For the test client (Lumina Wellness, `7cdb79c0-59db-4ba3-abfb-901c0d2d852e`) confirm every RLS policy returns the expected rows for the portal auth user. Confirm the agency view for that agency is unchanged. Confirm no other client's data is reachable from the portal user's session.

Watch Vercel logs through the Vercel MCP after you push. No 500s, no unexpected redirects, no missing environment variables, no Supabase connection errors.

---

## 11. Shipping discipline

Commit often with descriptive messages. One logical change per commit. Prefix commits with `fix(portal):`, `feat(portal):`, `refactor(portal):`, `test(portal):`, `docs(portal):`, or `chore(portal):` as appropriate. Keep commits small enough that a reviewer can read each diff in under five minutes.

Do not push code that fails build. Do not push code that fails typecheck on portal files. Do not push code that breaks tests. Do not push migrations without applying them to production first through the Supabase MCP, and do not apply migrations to production without also committing the SQL file to `migrations/` so the project has a durable record.

After every shipping session, update `memory-bank/activeContext.md` with what changed, what you learned, and what is next. Update `memory-bank/progress.md` with the new status of every dimension. If you discovered a pattern worth remembering across projects, add it under `/memories/` as user-scope memory; if it is specific to this repository, add it under `/memories/repo/`.

If you finish everything in this document and still have time, go back to the top and walk it again. You will find things you missed the first time. That is normal and welcome.

---

## 12. The mindset

The human's test is simple. They will log in as a client. Every module they open must show real data or a beautiful empty state. Every action they take must produce the expected side effects through email, in-app, and push. Every branded surface must say the client's brand name and colour. Every slow state must have a skeleton. Every empty state must have a call to action. Every error must have a recovery path. Every notification must reach them on whatever device they happen to be on. Every chat conversation must flow even when the AI is not available, because the agency approved a scripted fallback library that understands their niche.

If you can hand a new client a browser, a phone, and a calendar invite to try the portal for an afternoon, and they come back saying "this feels like Shopify" or "this feels like Intercom" or "this feels like Linear", you have succeeded.

Now go.
