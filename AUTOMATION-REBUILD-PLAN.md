# DRAMAC CMS — Automation Engine Rebuild Plan

> **Purpose**: A step-by-step plan for an AI agent to follow in order to make the automation engine fully functional. This document covers the current state, root causes of failure, and every fix needed — in precise, actionable language.
>
> **Rule**: Do NOT skip any step. Read the entire document before starting. Execute in order.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Current State — What Works, What Doesn't](#2-current-state)
3. [Root Causes — Why Automation Doesn't Work](#3-root-causes)
4. [Fix 1 — Install Missing Starter Packs](#4-fix-1-install-missing-starter-packs)
5. [Fix 2 — Switch to Admin Client for Event Logging](#5-fix-2-switch-to-admin-client-for-event-logging)
6. [Fix 3 — Fix the Action Executor Email Failures](#6-fix-3-fix-action-executor-email-failures)
7. [Fix 4 — Auto-Install Packs When Modules Are Enabled](#7-fix-4-auto-install-packs-when-modules-are-enabled)
8. [Fix 5 — Fix ensureSystemPacksInstalled Race Condition](#8-fix-5-fix-ensuresystempacksinstalled-race-condition)
9. [Fix 6 — Fix Execution Engine Fire-and-Forget Gap](#9-fix-6-fix-execution-engine-fire-and-forget-gap)
10. [Fix 7 — Remove .catch() Swallowing on Critical Paths](#10-fix-7-remove-catch-swallowing)
11. [Fix 8 — Verify All Event Types Match Between Emitter and Templates](#11-fix-8-verify-event-type-strings-match)
12. [Fix 9 — Verify Template Variable Names Match Payload Keys](#12-fix-9-verify-template-variable-names)
13. [Verification — How to Test Everything Works](#13-verification)
14. [File Reference — Every File That Matters](#14-file-reference)
15. [Database Reference — Tables and Columns](#15-database-reference)

---

## 1. Architecture Overview

The automation engine has 7 layers, executed in this order when an event occurs:

```
USER ACTION (booking, order, form submit, chat)
    │
    ▼
LAYER 1: Event Emission — logAutomationEvent()
    │  File: src/modules/automation/services/event-processor.ts
    │  INSERTs into: automation_events_log
    │
    ▼
LAYER 2: Subscription Matching — processEventImmediately()
    │  File: src/modules/automation/services/event-processor.ts
    │  Queries: automation_event_subscriptions WHERE event_type = X AND site_id = Y AND is_active = true
    │  Joins: automation_workflows to check workflow.is_active
    │
    ▼
LAYER 3: Execution Queuing — queueWorkflowExecution()
    │  File: src/modules/automation/services/event-processor.ts
    │  INSERTs into: workflow_executions with status = 'pending'
    │
    ▼
LAYER 4: Workflow Execution — executeWorkflow()
    │  File: src/modules/automation/services/execution-engine.ts
    │  Loads workflow steps by position, executes sequentially
    │  Updates workflow_executions with status, duration, etc.
    │
    ▼
LAYER 5: Step Execution — executeStep()
    │  File: src/modules/automation/services/execution-engine.ts
    │  Resolves {{trigger.fieldName}} variables from event payload
    │  Delegates to action executor, condition evaluator, or delay handler
    │  Logs to: step_execution_logs
    │
    ▼
LAYER 6: Action Execution — executeAction()
    │  File: src/modules/automation/services/action-executor.ts
    │  Handles action types: email.send_branded_template, notification.in_app, chat.send_message, etc.
    │  Actually sends emails via sendBrandedEmail()
    │
    ▼
LAYER 7: Notification Dispatcher — dispatchNotification()
    │  File: src/lib/notifications/automation-aware-dispatcher.ts
    │  Called AFTER logAutomationEvent, checks if an active system workflow exists
    │  If YES: skips the hardcoded notification (automation handles it)
    │  If NO: fires the hardcoded notification as fallback
```

### Key Concept: Dual-Dispatch Safety

The system is designed so:
1. `logAutomationEvent()` is called FIRST — this triggers the automation engine
2. `dispatchNotification()` is called SECOND — this checks if automation handled it

If a system workflow exists and is active for the event type, `dispatchNotification` sees it and skips the hardcoded notification. If no workflow exists, the hardcoded notification fires as fallback.

This means: **if no system workflow exists for an event type, automation does nothing and the old hardcoded notification fires instead.** This is exactly what is happening now.

### Supabase Client Types

There are TWO Supabase client factories:

1. **`createClient()`** from `src/lib/supabase/server.ts`
   - Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` + request cookies
   - Subject to Row Level Security (RLS)
   - Authenticated as the current user (dashboard admin, or anonymous for public visitors)

2. **`createAdminClient()`** from `src/lib/supabase/admin.ts`
   - Uses `SUPABASE_SERVICE_ROLE_KEY`
   - Bypasses ALL RLS policies
   - Use for server-side background operations

### RLS Policies on Automation Tables

All three core automation tables have the SAME policy pattern:

```sql
-- Bypasses RLS entirely for background processing
CREATE POLICY "Service role bypass ..." ON <table>
  FOR ALL USING (auth.role() = 'service_role');

-- Dashboard users can access their site's data
CREATE POLICY "Users can access their site ..." ON <table>
  FOR ALL USING (public.can_access_site(site_id));
```

The `can_access_site(site_id)` function checks:
```sql
SELECT EXISTS (
  SELECT 1 FROM public.sites s
  WHERE s.id = check_site_id
  AND (s.agency_id = public.get_current_agency_id() OR public.is_super_admin())
)
```

**Critical implication**: Public storefront visitors (booking customers, checkout users, form submitters) do NOT have an agency membership. When `logAutomationEvent` uses `createClient()`, the INSERT into `automation_events_log` will **fail silently** for public users because `can_access_site` returns false.

---

## 2. Current State

### What IS in the Database

Queried directly from Supabase on the production database:

**automation_workflows** — 4 rows (all from essential-communications pack):
| Name | is_system | pack_id | system_event_type | is_active | total_runs |
|------|-----------|---------|-------------------|-----------|------------|
| Form Submission Notification | true | essential-communications | form.submission.received | true | 1 (failed) |
| New Chat Message Notification | true | essential-communications | live_chat.message.received | true | 0 |
| Missed Chat Notification | true | essential-communications | live_chat.conversation.missed | true | 0 |
| Chat Assigned Notification | true | essential-communications | live_chat.conversation.assigned | true | 2 (success) |

**automation_event_subscriptions** — 5 rows:
All for the 4 workflows above. One duplicate subscription exists for `live_chat.conversation.assigned`.
**ZERO** subscriptions for ANY booking or ecommerce event type.

**automation_events_log** — 13 rows total:
- 10x `ecommerce.order.status_changed` (from site `3db77c52`, not the main site)
- 2x `ecommerce.order.shipped` (from site `3db77c52`)
- 1x `crm.contact.deleted` (from the main site)
- **ZERO** `booking.*` events — ever
- **ZERO** `ecommerce.order.created` events

**workflow_executions** — 3 rows:
- 2x Chat Assigned Notification — completed successfully
- 1x Form Submission Notification — failed ("Failed to send branded email")

**automation_installed_packs** — 0 rows (table exists but is empty; not used by the install logic)

**site_module_installations** — Main site has ALL modules enabled:
automation, booking, crm, ecommerce, live-chat

### What IS in the Code But NOT in the Database

The code defines 27 system workflow templates in `system-templates.ts`:
- 8 booking templates
- 15 ecommerce templates (8 order + 7 quote)
- 1 form template
- 3 chat templates

The code defines 3 system starter packs in `starter-packs.ts`:
- `essential-communications` — 4 templates (form + chat) — **INSTALLED ✅**
- `booking-communications` — 8 templates — **NOT INSTALLED ❌**
- `ecommerce-communications` — 15 templates — **NOT INSTALLED ❌**

### What the User Sees

- Bookings work: confirmation emails arrive, chat messages appear, CRM contacts are created
- Orders work: order emails arrive
- Automation page: only 4 workflows visible, all chat/form related
- Automation executions: 3 total, 66.7% success rate
- "Everything else works, but automation does nothing"

---

## 3. Root Causes

### Root Cause 1: Booking and E-Commerce Starter Packs Were Never Installed (CRITICAL)

**Evidence**: Only 4 workflows exist in the database, all from `essential-communications`. Zero workflows for booking or ecommerce.

**Why**: The `installDefaultAutomationPacks` function in `src/lib/actions/sites.ts` is called during site creation, but only when the `automation` module is being installed in `installCoreModules()`. The main site (`a1a00001-...`) was created from seed data — it was NOT created through the normal `installCoreModules` flow. Therefore, `installDefaultAutomationPacks` was never called during site creation.

The backup mechanism — `ensureSystemPacksInstalled` called from `template-gallery.tsx` — runs when a user visits the Automation template gallery. The essential-communications pack WAS installed (likely from this path), but the booking and ecommerce packs were NOT. This could be because:
- The gallery was visited before the booking/ecommerce pack code was added
- A silent error occurred during booking/ecommerce pack installation
- The `installStarterPack` function checked `pack_id` on existing workflows, found the essential-communications workflows, and then failed on the booking/ecommerce templates due to a template structure mismatch

**Impact**: With no booking/ecommerce workflows in the database, there are no event subscriptions. When `processEventImmediately` runs for a booking event, it finds zero matching subscriptions and returns `{ workflowsTriggered: 0 }`. The automation engine simply has nothing to execute.

**Impact on dispatcher**: Since no system workflows exist for booking/ecommerce events, `hasActiveSystemWorkflow()` returns `false`, and `dispatchNotification()` falls through to the hardcoded notification function every time. This is why emails still arrive — they come from the hardcoded functions, not from automation.

### Root Cause 2: RLS Blocks Public Users from Logging Events (CRITICAL)

**Evidence**: Zero booking events in `automation_events_log` despite bookings being created.

**Why**: The `logAutomationEvent()` function in `event-processor.ts` creates its Supabase client via `createClient()` (from `src/lib/supabase/server.ts`). This factory uses the ANON key + request cookies. When a public storefront visitor makes a booking or checkout, they are NOT authenticated as a dashboard user. Their cookies contain no agency membership. The `can_access_site(site_id)` RLS check fails, and the INSERT into `automation_events_log` is rejected by PostgREST.

The error is swallowed because all `logAutomationEvent` calls are wrapped in `.catch()`:
```typescript
await logAutomationEvent(siteId, ...).catch((err) => console.error(...));
```

So the failure is silent — no error surfaces to the user, and no event is logged.

**Impact**: Even if the booking/ecommerce packs were installed, events from public users would never reach the automation engine.

### Root Cause 3: Form Submission Workflow Email Action Fails

**Evidence**: The one Form Submission workflow execution has `status: 'failed'` with `error: 'Failed to send branded email'`.

**Why**: The action executor's `executeEmailAction` for `send_branded_template` requires a valid `siteId` from the execution context to look up the site's `agency_id` (needed for branded email templates). The Form Submission event's payload or context may not include `siteId` correctly, or the branded email template lookup fails for another reason (missing template configuration, missing agency branding).

**Impact**: Even the ONE system workflow that IS installed and receives events fails to actually send emails through automation.

### Root Cause 4: No Auto-Install Hook for Module Enablement

**Evidence**: Code inspection shows `autoInstallPacksForModule` is exported but never called from the module installation flow.

**Why**: When a module like `booking` or `ecommerce` is enabled on a site, nothing triggers the installation of the corresponding automation pack. The `installCoreModules` function only calls `installDefaultAutomationPacks` when the `automation` module is installed — not when booking or ecommerce modules are installed.

**Impact**: For sites that already have the automation module but later enable booking or ecommerce, the corresponding automation packs are never installed.

### Root Cause 5: executeWorkflow Is Fire-and-Forget with No Retry

**Evidence**: In `processEventImmediately()`, the workflow execution is triggered as:
```typescript
executeWorkflow(executionId)
  .then(() => console.log("..."))
  .catch((execError) => console.error("..."));
```

**Why**: The execution is intentionally non-blocking (so the original action like booking creation doesn't wait). This is fine. But if the execution fails, there is no retry mechanism. The `workflow_executions` row is updated to `failed`, but nothing attempts to re-run it.

**Impact**: One-shot execution. If it fails due to a transient error (network, rate limit, etc.), the notification is lost.

---

## 4. Fix 1 — Install Missing Starter Packs

**Goal**: Get the booking-communications and ecommerce-communications packs installed in the database, with all their workflows and event subscriptions active.

### Step 1.1: Verify Template IDs Match

Open `src/modules/automation/lib/starter-packs.ts` and read the `templateIds` arrays for both packs:

**booking-communications**:
```
system-booking-created, system-booking-confirmed, system-booking-cancelled,
system-booking-completed, system-booking-no-show, system-booking-payment-received,
system-booking-reminder, system-booking-cancelled-followup
```

**ecommerce-communications**:
```
system-order-created, system-order-shipped, system-order-delivered,
system-order-cancelled, system-payment-received, system-payment-proof-uploaded,
system-refund-issued, system-low-stock-alert, system-quote-created,
system-quote-sent, system-quote-reminder, system-quote-accepted,
system-quote-rejected, system-quote-amendment, system-quote-converted
```

Now open `src/modules/automation/lib/system-templates.ts` and verify that EVERY template ID above exists in the `ALL_WORKFLOW_TEMPLATES` array. Search for each ID. If any are missing, the `installStarterPack` function will skip that template and log an error, but continue with the rest.

If any template is missing from `ALL_WORKFLOW_TEMPLATES`, add it to the appropriate section (BOOKING, ECOMMERCE, or QUOTE templates) following the exact structure of existing templates.

### Step 1.2: Create an API Route or Script to Force-Install Packs

Create a new API route at `src/app/api/admin/install-automation-packs/route.ts`. This route will:
1. Accept POST requests (protected — verify the caller is an authenticated admin)
2. Call `ensureSystemPacksInstalled(siteId)` for the specific site
3. Return a detailed JSON response with which packs were installed, which were already present, and any errors

Here is the exact logic the route must implement:

```
1. Import ensureSystemPacksInstalled from @/modules/automation/actions/automation-actions
2. Import createClient from @/lib/supabase/server
3. Get the authenticated user from supabase.auth.getUser()
4. If no user, return 401
5. Get the user's siteId from the request body or query params
6. Call ensureSystemPacksInstalled(siteId)
7. Return the result as JSON
```

However, this route uses `createClient()` which is the user-authenticated client. Since the admin IS authenticated, this will work for admin-triggered installations. But see Fix 2 for the long-term solution.

### Step 1.3: Test the Installation

After creating the route, call it with the main site ID: `a1a00001-0001-4000-b000-000000000001`

Then verify in the database:
```sql
SELECT name, is_system, pack_id, system_event_type, is_active
FROM automation_workflows
WHERE site_id = 'a1a00001-0001-4000-b000-000000000001'
ORDER BY pack_id, name;
```

You should see 27 workflows total: 4 essential + 8 booking + 15 ecommerce. All should have `is_system = true`, correct `pack_id`, correct `system_event_type`, and `is_active = true`.

Also verify subscriptions:
```sql
SELECT es.event_type, es.is_active, w.name as workflow_name
FROM automation_event_subscriptions es
JOIN automation_workflows w ON w.id = es.workflow_id
WHERE es.site_id = 'a1a00001-0001-4000-b000-000000000001'
ORDER BY es.event_type;
```

You should see one subscription per workflow, each with the correct event_type.

### Step 1.4: Handle the "Already Installed" Check

The `installStarterPack` function checks:
```typescript
const { data: existing } = await supabase
  .from("automation_workflows")
  .select("id")
  .eq("site_id", siteId)
  .eq("pack_id", packId)
  .limit(1);

if (existing && existing.length > 0) {
  return { success: true, workflowsCreated: 0, errors: ["Pack already installed"] };
}
```

If this returns rows (i.e., even ONE workflow has `pack_id = 'booking-communications'`), the entire pack installation is skipped. This means:
- If a partial installation occurred (some templates created, some failed), the pack is considered "installed" and re-running won't create the missing workflows
- You may need to DELETE partially-installed workflows before re-installing

To handle partial installs, add logic to `installStarterPack` that counts how many workflows exist for the pack vs how many templates the pack has, and only skips if the counts match. Or provide a `force` parameter that skips the already-installed check.

---

## 5. Fix 2 — Switch to Admin Client for Event Logging

**Goal**: Ensure `logAutomationEvent()` can successfully INSERT into `automation_events_log` regardless of who triggered the action (dashboard admin, public visitor, API call).

### Step 2.1: Modify event-processor.ts

File: `src/modules/automation/services/event-processor.ts`

Change the import at the top of the file:
- Remove: `import { createClient } from "@/lib/supabase/server";`
- Add: `import { createAdminClient } from "@/lib/supabase/admin";`

Then, in THREE places within this file, change `await createClient()` to `createAdminClient()`:

1. **In `logAutomationEvent()`**: The line that creates the supabase client for inserting into `automation_events_log` and updating it after processing.
2. **In `processEventImmediately()`**: The line that creates the supabase client for querying `automation_event_subscriptions`.
3. **In `queueWorkflowExecution()`**: The line that creates the supabase client for inserting into `workflow_executions` and querying `workflow_steps`.

Note: `createAdminClient()` is synchronous (it does NOT need `await`). So change:
```typescript
const supabase = (await createClient()) as AutomationDB;
```
to:
```typescript
const supabase = createAdminClient() as unknown as AutomationDB;
```

### Step 2.2: Modify execution-engine.ts

File: `src/modules/automation/services/execution-engine.ts`

Apply the same change. Find every `createClient()` call and replace with `createAdminClient()`. The execution engine reads workflows, steps, and writes execution logs and step logs — all of which need service_role access to bypass RLS.

### Step 2.3: Modify action-executor.ts

File: `src/modules/automation/services/action-executor.ts`

Apply the same change. The action executor queries `sites` table for `agency_id`, sends emails, creates notifications, etc. All database operations should use the admin client to avoid RLS issues.

### Step 2.4: Why This Is Safe

The automation engine runs entirely on the server (these are server-side modules, not client components). The `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the browser. Using the admin client here is the correct pattern because:
- The engine processes events on behalf of the system, not on behalf of a specific user
- RLS is designed for user-facing queries; background processing should use service_role
- The engine already validates site_id and event_type before processing

### Step 2.5: Verify No Client-Side Imports

After the change, do a grep to confirm `createAdminClient` is never imported in any file under `src/app/` that is a Client Component (files with `"use client"` at the top). It should only appear in Server Components, Server Actions (`"use server"`), API routes, and utility modules.

---

## 6. Fix 3 — Fix Action Executor Email Failures

**Goal**: Ensure the `email.send_branded_template` action type in the action executor correctly resolves all required data and sends emails successfully.

### Step 3.1: Understand the Failure

The Form Submission workflow execution failed with `error: "Failed to send branded email"`. This error comes from `executeEmailAction()` in `action-executor.ts`.

### Step 3.2: Read executeEmailAction

Open `src/modules/automation/services/action-executor.ts` and find the `executeEmailAction` function. Specifically look at the `send_branded_template` case. It:
1. Gets `siteId` from the execution context
2. Queries the `sites` table for `agency_id` using that `siteId`
3. Gets the email type and template data from the step config
4. Calls `sendBrandedEmail()` with the agency_id, email_type, to, data

### Step 3.3: Verify siteId Is in the Execution Context

The execution context is built in `queueWorkflowExecution()`:
```typescript
context: { trigger: triggerData, steps: {}, variables: {} }
```

The `triggerData` is the event payload. The `siteId` is passed separately as a field on the `workflow_executions` row, NOT in the trigger data. The `executeWorkflow` function loads the execution row, which has `site_id`.

Check that `executeEmailAction` reads `siteId` from `execution.site_id` (the execution row), NOT from `context.trigger.siteId` (the payload). If it reads from the wrong place, it will be undefined.

### Step 3.4: Verify the sites Query

The email action queries:
```typescript
const { data: site } = await supabase
  .from("sites")
  .select("agency_id")
  .eq("id", siteId)
  .single();
```

After Fix 2, this will use `createAdminClient()` which bypasses RLS. Previously, if `createClient()` was used, this query might fail if the automation engine's supabase client doesn't have access to the `sites` table through RLS.

### Step 3.5: Verify sendBrandedEmail Parameters

Check that `sendBrandedEmail()` receives:
- `agencyId`: from the sites query above
- `emailType`: from `config.email_type` (e.g., "form_submission_notification")  
- `to`: from `config.to` after variable resolution (e.g., resolved from `{{trigger.ownerEmail}}`)
- `data`: from `config.data` after variable resolution

If `config.to` resolves to an empty string or undefined (because the trigger payload doesn't have the expected field name), the email will fail.

### Step 3.6: Verify Variable Resolution

The execution engine resolves `{{trigger.fieldName}}` by looking up `fieldName` in the context's trigger data. The context's trigger data is the event payload passed to `logAutomationEvent`. 

For form submissions, check what payload keys `logAutomationEvent` receives in `src/app/api/forms/submit/route.ts`. Then check what template variables the Form Submission template expects in `system-templates.ts` (template ID: `system-form-submission`). The variable names must match EXACTLY.

For example, if the template expects `{{trigger.submitterEmail}}` but the payload has `email`, the variable won't resolve.

### Step 3.7: Fix Variable Name Mismatches

Open `system-templates.ts` and find the `system-form-submission` template. List every `{{trigger.X}}` variable it uses. Then open `src/app/api/forms/submit/route.ts` and find the `logAutomationEvent` call. List every key in the payload object. Make them match.

Repeat this process for EVERY system template. This is critical. See Fix 9 for the complete list.

---

## 7. Fix 4 — Auto-Install Packs When Modules Are Enabled

**Goal**: When a site enables the booking or ecommerce module, automatically install the corresponding automation pack.

### Step 4.1: Find the Module Installation Logic

The module installation for a site happens in `src/lib/actions/sites.ts` in the `installCoreModules` function (called during site creation) and in whatever function handles module enablement from the dashboard.

Search for where modules are enabled/installed:
```
grep -r "site_module_installations" --include="*.ts" -l
```

### Step 4.2: Add autoInstallPacksForModule Calls

In the function that enables a module for a site, add a call to `autoInstallPacksForModule` after the module is successfully enabled:

```typescript
// After module is enabled:
if (["booking", "ecommerce"].includes(moduleSlug)) {
  const { autoInstallPacksForModule } = await import(
    "@/modules/automation/actions/automation-actions"
  );
  await autoInstallPacksForModule(siteId, moduleSlug).catch((err) =>
    console.error(`[Sites] Failed to auto-install automation packs for ${moduleSlug}:`, err)
  );
}
```

### Step 4.3: Fix the installCoreModules Order

In `src/lib/actions/sites.ts`, the `installCoreModules` function loops through modules. The `installDefaultAutomationPacks` call happens when `mod.slug === "automation"`. But at this point in the loop, other modules may not have been inserted yet.

Fix: Move the `installDefaultAutomationPacks` call to AFTER the entire module installation loop completes, not inside the loop:

```typescript
// Current (broken):
for (const mod of coreModules) {
  // install module...
  if (mod.slug === "automation") {
    await installDefaultAutomationPacks(siteId); // ← Other modules not installed yet!
  }
}

// Fixed:
for (const mod of coreModules) {
  // install module...
}
// After ALL modules are installed:
await installDefaultAutomationPacks(siteId); // ← All modules now in site_module_installations
```

This ensures `getPacksForModules` finds ALL installed module slugs and returns ALL applicable packs.

---

## 8. Fix 5 — Fix ensureSystemPacksInstalled Race Condition

**Goal**: Make the template gallery's auto-install actually work as a safety net.

### Step 5.1: Understand the Current Call

In `src/modules/automation/components/template-gallery.tsx`, the `loadInstalledPacks` callback:
```typescript
const loadInstalledPacks = useCallback(async () => {
  await ensureSystemPacksInstalled(siteId);
  const result = await getInstalledPacks(siteId);
  // ...
}, [siteId]);
```

This runs on component mount via `useEffect`. It calls the server action `ensureSystemPacksInstalled` which checks installed modules and installs missing packs.

### Step 5.2: Add Error Surfacing

The `ensureSystemPacksInstalled` function catches all errors silently:
```typescript
} catch (error) {
  console.error("[Automation] ensureSystemPacksInstalled error:", error);
}
```

Add a return value that indicates errors occurred. The template gallery should show a warning toast if pack installation failed, prompting the user to try again or contact support.

### Step 5.3: Handle Partial Installations

Modify `installStarterPack` to handle the case where a pack was partially installed (some templates succeeded, others failed). Currently, if even ONE workflow has `pack_id = 'booking-communications'`, the entire pack is considered "installed" and no new workflows are created.

Change the check from "any workflow with this pack_id exists" to "all template IDs in the pack have corresponding workflows":

```
1. Get all workflows WHERE pack_id = packId for this siteId
2. Get the set of system_event_type values from those workflows
3. Compare against the pack's templateIds → each template has a systemEventType
4. If all templates have corresponding workflows, pack is fully installed
5. If some are missing, install only the missing ones (skip existing)
```

---

## 9. Fix 6 — Fix Execution Engine Fire-and-Forget Gap

**Goal**: Ensure workflow execution results are properly recorded even in the fire-and-forget pattern.

### Step 6.1: Verify executeWorkflow Updates Execution Status

Open `src/modules/automation/services/execution-engine.ts` and confirm that `executeWorkflow()`:
1. Updates `workflow_executions.status` to `'running'` when it starts
2. Updates to `'completed'` when all steps succeed
3. Updates to `'failed'` with the error message when any step fails
4. Records `completed_at`, `duration_ms`, `steps_completed`

If any of these updates are missing, add them.

### Step 6.2: Verify Workflow Stats Are Updated

After a workflow execution completes (success or failure), confirm that `automation_workflows` stats are updated:
- `total_runs` incremented by 1
- `successful_runs` or `failed_runs` incremented appropriately
- `last_run_at` set to now
- `last_success_at` or `last_error_at` set accordingly

If these updates are not in `executeWorkflow`, add them. Use the admin client.

### Step 6.3: Add a Basic Retry for Transient Failures

In `processEventImmediately`, after the fire-and-forget `executeWorkflow` call, the `.catch()` only logs the error. Consider adding a simple retry: if the error is transient (network timeout, rate limit), queue a delayed retry execution. This is optional but improves reliability.

---

## 10. Fix 7 — Remove .catch() Swallowing on Critical Paths

**Goal**: Stop silently swallowing errors on `logAutomationEvent` calls so failures can be debugged.

### Step 7.1: Identify All .catch() Calls

Search the codebase for every `logAutomationEvent` call that has `.catch()`:

```
grep -rn "logAutomationEvent" --include="*.ts" | grep "catch"
```

Files that have this pattern:
- `src/modules/booking/actions/booking-actions.ts`
- `src/modules/ecommerce/actions/public-ecommerce-actions.ts`
- `src/modules/ecommerce/actions/order-actions.ts`
- `src/modules/ecommerce/actions/quote-actions.ts`
- `src/modules/ecommerce/actions/quote-workflow-actions.ts`
- `src/app/api/forms/submit/route.ts`

### Step 7.2: Change from .catch() to await with try/catch

For each call site, change from:
```typescript
await logAutomationEvent(...).catch((err) => console.error("...", err));
```

To:
```typescript
try {
  await logAutomationEvent(...);
} catch (err) {
  console.error("[MODULE] Automation event error — event NOT logged:", err);
  // Note: Do NOT re-throw. Event logging failure should not block the main action.
}
```

This keeps the non-blocking behavior (failure doesn't prevent the booking/order from being created) but makes the error message more explicit. The `.catch()` pattern can mask whether the `await` actually waited or not.

### Step 7.3: Add Structured Logging

In each catch block, include the event type and siteId so errors can be traced:
```typescript
console.error(`[Booking] logAutomationEvent FAILED for event=${EVENT_REGISTRY.booking.appointment.created} siteId=${siteId}:`, err);
```

---

## 11. Fix 8 — Verify All Event Types Match Between Emitter and Templates

**Goal**: Ensure the event type strings used in `logAutomationEvent` calls match EXACTLY the `systemEventType` values in system templates and the `event_type` values in trigger configs.

### The Chain of Event Type Strings

When an event fires, the event type string must be IDENTICAL across 4 places:
1. **logAutomationEvent call**: The second argument (e.g., `EVENT_REGISTRY.booking.appointment.created`)
2. **System template definition**: The `systemEventType` field (e.g., `"booking.appointment.created"`)
3. **System template trigger config**: `trigger.config.event_type` (e.g., `"booking.appointment.created"`)
4. **dispatchNotification call**: The `eventType` parameter (e.g., `"booking.appointment.created"`)

If ANY of these don't match, the pipeline breaks.

### Step 8.1: Read EVENT_REGISTRY

Open `src/modules/automation/lib/event-types.ts` and read the complete `EVENT_REGISTRY` object. List every event type string.

### Step 8.2: Cross-Reference with Templates

For each event type in EVENT_REGISTRY, find the corresponding template in `system-templates.ts` and verify:
- `template.systemEventType` === the event type string
- `template.trigger.config.event_type` === the event type string

### Step 8.3: Cross-Reference with Action Code

For each event type, find the corresponding `logAutomationEvent` call in the action files and verify:
- The second argument to `logAutomationEvent` uses `EVENT_REGISTRY.xxx` which resolves to the expected string
- The `dispatchNotification` call right after uses the SAME string for `eventType`

### Expected Booking Event Types
```
booking.appointment.created
booking.appointment.confirmed
booking.appointment.cancelled
booking.appointment.completed
booking.appointment.no_show
booking.appointment.payment_received
booking.appointment.reminder
```

### Expected Ecommerce Event Types
```
ecommerce.order.created
ecommerce.order.shipped
ecommerce.order.delivered
ecommerce.order.cancelled
ecommerce.order.status_changed
ecommerce.payment.received
ecommerce.payment.proof_uploaded
ecommerce.refund.issued
ecommerce.stock.low
ecommerce.quote.created
ecommerce.quote.sent
ecommerce.quote.reminder
ecommerce.quote.accepted
ecommerce.quote.rejected
ecommerce.quote.amendment_requested
ecommerce.quote.converted
```

### Step 8.4: Fix Any Mismatches

If a `logAutomationEvent` call uses a raw string like `"booking.created"` instead of `EVENT_REGISTRY.booking.appointment.created`, change it to use EVENT_REGISTRY. If EVENT_REGISTRY is missing an entry, add it. If a template's systemEventType doesn't match, fix the template.

---

## 12. Fix 9 — Verify Template Variable Names Match Payload Keys

**Goal**: Ensure every `{{trigger.X}}` variable in system templates resolves to an actual value from the event payload.

### How Variable Resolution Works

The execution engine resolves variables at step execution time. When a step config has:
```json
{ "to": "{{trigger.customerEmail}}" }
```

The engine looks up `customerEmail` in the execution context's `trigger` data, which is the event payload from `logAutomationEvent`.

If the payload key is `customer_email` (snake_case) but the template expects `{{trigger.customerEmail}}` (camelCase), the variable resolves to `undefined` and the email will have no recipient.

### Step 9.1: Audit Every Template

For EACH system template in `system-templates.ts`:
1. List every `{{trigger.X}}` variable used in any step's `action_config`
2. Find the corresponding `logAutomationEvent` call in the action files
3. List every key in the payload object
4. Verify that every template variable name exists as a payload key

### Expected Payload Structure for Booking Created

In `booking-actions.ts`, the payload for `booking.appointment.created` is:
```typescript
{
  appointmentId: created.id,
  serviceName: ...,
  servicePrice: ...,
  serviceDuration: ...,
  customerName: ...,
  customerEmail: ...,
  customerPhone: ...,
  startTime: ...,
  endTime: ...,
  staffName: ...,
  status: ...,
  paymentStatus: ...,
}
```

The template `system-booking-created` must use these EXACT keys:
```
{{trigger.appointmentId}}
{{trigger.serviceName}}
{{trigger.servicePrice}}
{{trigger.customerName}}
{{trigger.customerEmail}}
{{trigger.startTime}}
{{trigger.staffName}}
```

If the template uses `{{trigger.customer_name}}` instead of `{{trigger.customerName}}`, it will resolve to undefined.

### Step 9.2: Fix Mismatches

Choose ONE convention (camelCase is used in the booking payload) and update ALL templates and ALL payloads to use the same convention. The payload keys take priority since they're in the action code that's already deployed.

### Step 9.3: Document the Payload Contract

For each event type, document the expected payload shape. This serves as a contract between the event emitter (action code) and the event consumer (template steps). Add this documentation as a comment block in `event-types.ts` next to each EVENT_REGISTRY entry.

---

## 13. Verification

After applying all fixes, verify the system works end-to-end.

### Test 1: Verify Packs Are Installed

Run this SQL against Supabase:
```sql
SELECT pack_id, count(*) as workflow_count, 
       bool_and(is_active) as all_active,
       bool_and(is_system) as all_system
FROM automation_workflows
WHERE site_id = 'a1a00001-0001-4000-b000-000000000001'
GROUP BY pack_id
ORDER BY pack_id;
```

Expected: 3 rows — essential-communications (4), booking-communications (8), ecommerce-communications (15). All active, all system.

### Test 2: Verify Event Subscriptions

```sql
SELECT event_type, count(*) as sub_count
FROM automation_event_subscriptions
WHERE site_id = 'a1a00001-0001-4000-b000-000000000001' AND is_active = true
GROUP BY event_type
ORDER BY event_type;
```

Expected: One subscription per workflow, covering all booking and ecommerce event types.

### Test 3: Create a New Booking (Storefront)

1. Open the public storefront booking page
2. Create a new appointment
3. Within 5 seconds, check these tables:

```sql
-- Event should be logged
SELECT * FROM automation_events_log 
WHERE event_type = 'booking.appointment.created' 
ORDER BY created_at DESC LIMIT 1;

-- Should show processed = true, workflows_triggered = 1
-- The workflow execution should exist
SELECT we.status, we.error, we.steps_completed, we.duration_ms
FROM workflow_executions we
WHERE we.site_id = 'a1a00001-0001-4000-b000-000000000001'
ORDER BY we.started_at DESC LIMIT 1;
```

### Test 4: Check the Dispatcher Behavior

After creating the booking, verify that the hardcoded notification did NOT fire (since automation should handle it now). Check:
1. The customer should receive exactly ONE confirmation email (from automation), not two
2. Vercel function logs should show: `[Automation] Event booking.appointment.created processed: 1 workflows triggered`
3. The dispatcher should log nothing (it returns early when `hasActiveSystemWorkflow` is true)

### Test 5: Test Form Submission

Submit a form through the storefront. Verify:
1. Event logged in `automation_events_log` with type `form.submission.received`
2. Workflow execution completed successfully (check `workflow_executions`)
3. Email was sent through the automation engine, NOT through the hardcoded function

### Test 6: Test E-commerce Order

Create a test order via checkout. Verify:
1. Event `ecommerce.order.created` logged
2. Workflow triggered and completed
3. Order confirmation email sent via automation

### Test 7: Verify No Duplicate Notifications

For each event type tested, confirm the customer received EXACTLY one notification (email/chat), not two. If they received two, the `dispatchNotification` fallback is firing when it shouldn't — which means `hasActiveSystemWorkflow` is returning false even though a workflow exists. Debug by checking:
- Does the workflow have `is_system = true`?
- Does the workflow have the correct `system_event_type`?
- Is the workflow `is_active = true`?
- Is the `site_id` correct?

---

## 14. File Reference

### Core Automation Engine

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `src/modules/automation/services/event-processor.ts` | Event logging + subscription matching + execution queuing | Fix 2 (admin client), Fix 7 (error handling) |
| `src/modules/automation/services/execution-engine.ts` | Workflow + step execution | Fix 2 (admin client), Fix 6 (stats update) |
| `src/modules/automation/services/action-executor.ts` | Action execution (email, notification, chat, webhook) | Fix 2 (admin client), Fix 3 (email fix) |

### Automation Configuration

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `src/modules/automation/lib/system-templates.ts` | 27 system workflow templates | Fix 8 (event type verification), Fix 9 (variable names) |
| `src/modules/automation/lib/starter-packs.ts` | 7 pack definitions (3 system, 4 optional) | Fix 5 (partial install handling) |
| `src/modules/automation/lib/event-types.ts` | EVENT_REGISTRY with all event type strings | Fix 8 (cross-reference) |
| `src/modules/automation/lib/templates.ts` | WorkflowTemplate TypeScript interface | Read for understanding |

### Automation Actions (Server Actions)

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `src/modules/automation/actions/automation-actions.ts` | installStarterPack, activateWorkflow, ensureSystemPacksInstalled, createWorkflowFromTemplate | Fix 1 (manual install), Fix 5 (partial install) |

### Notification Dispatcher

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `src/lib/notifications/automation-aware-dispatcher.ts` | hasActiveSystemWorkflow + dispatchNotification | Fix 2 (admin client — optional, only if checks fail for public users) |

### Action Code (Event Emitters)

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `src/modules/booking/actions/booking-actions.ts` | Booking CRUD — emits booking events | Fix 7 (.catch removal), Fix 8 + 9 (verification) |
| `src/modules/ecommerce/actions/public-ecommerce-actions.ts` | Checkout — emits order.created | Fix 7, Fix 8 + 9 |
| `src/modules/ecommerce/actions/order-actions.ts` | Order management — emits status/payment/refund events | Fix 7, Fix 8 + 9 |
| `src/modules/ecommerce/actions/quote-actions.ts` | Quote creation — emits quote.created | Fix 7, Fix 8 + 9 |
| `src/modules/ecommerce/actions/quote-workflow-actions.ts` | Quote lifecycle — emits send/accept/reject/convert events | Fix 7, Fix 8 + 9 |
| `src/app/api/forms/submit/route.ts` | Form submission API — emits form.submission.received | Fix 7, Fix 8 + 9 |

### Site Management

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `src/lib/actions/sites.ts` | Site creation, module installation | Fix 4 (loop order), Fix 4 (module enable hooks) |

### Automation UI

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `src/modules/automation/components/template-gallery.tsx` | Template gallery — calls ensureSystemPacksInstalled on mount | Fix 5 (error surfacing) |

---

## 15. Database Reference

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `automation_workflows` | Workflow definitions | id, site_id, name, is_system, pack_id, system_event_type, is_active, trigger_type, trigger_config, total_runs, successful_runs, failed_runs |
| `workflow_steps` | Steps within a workflow | id, workflow_id, name, step_type, action_type, action_config, position |
| `automation_event_subscriptions` | Maps event types to workflows | id, site_id, workflow_id, event_type, is_active, event_filter |
| `automation_events_log` | Log of all emitted events | id, site_id, event_type, payload, processed, workflows_triggered |
| `workflow_executions` | Individual workflow runs | id, workflow_id, site_id, status, trigger_data, context, error, steps_completed, duration_ms |
| `step_execution_logs` | Individual step runs | id, execution_id, step_id, status, input_data, output_data, error |
| `automation_installed_packs` | Pack installation tracking (currently unused) | — |
| `site_module_installations` | Which modules are enabled per site | id, site_id, module_id, is_enabled |
| `sites` | Site info | id, agency_id (needed for branded email lookup) |

### Supabase Project

- **Project ID**: `nfirsqmyxmmtbignofgb`
- **Main Site ID**: `a1a00001-0001-4000-b000-000000000001`

---

## Priority Order

Execute fixes in this order:

1. **Fix 2** — Switch to admin client (unblocks everything for public users)
2. **Fix 1** — Install missing packs (creates the workflows and subscriptions)
3. **Fix 8 + 9** — Verify event types and variable names match (prevents runtime failures)
4. **Fix 3** — Fix email action failures (makes executions succeed)
5. **Fix 7** — Remove .catch() swallowing (enables debugging)
6. **Fix 4** — Auto-install on module enablement (prevents future sites from having this problem)
7. **Fix 5** — Fix partial installation handling (robustness)
8. **Fix 6** — Execution stats and retry (polish)

---

## Summary

The automation engine's code is architecturally sound. The execution engine, action executor, and system templates are all well-built and functional. The proof is that Chat Assigned workflows execute successfully and email actions work.

The REASON automation "does nothing" for bookings and e-commerce is simple: **the booking and e-commerce workflow packs were never installed**, so there are no workflows to run and no subscriptions to match events against. 

The SECONDARY reason is that **event logging uses a user-authenticated client**, which fails silently for public storefront visitors due to RLS policies.

Fix these two things and the automation engine will come alive. The remaining fixes (3-9) handle edge cases, error visibility, and future-proofing.
