# PHASE LAUNCH-05: Agency Owner & Full Platform E2E

**User Journeys Covered**: 6.1 (Inherited), 6.2 (Onboarding), 6.3 (Billing & Subscription), 6.4 (White-Label & Branding), 6.5 (Team Roles), 6.6 (Module Requests), 6.7 (AI Website Designer), 6.8 (Studio), 6.9 (AI Agents), 6.10 (Automation), 6.11 (Social Media), 6.12 (CRM), 6.13 (Impersonate Client)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: Branding shares with LAUNCH-02 (Portal branding). AI Designer shares with LAUNCH-11 (Website Creation). Modules share with LAUNCH-04 (Module Installation).

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md
memory-bank/systemPatterns.md (All sections — Studio, AI Designer, Email, Locale)
memory-bank/activeContext.md (FIX-05: Branding SSR, FIX-07: Studio/Preview)
docs/USER-JOURNEYS.md (Section 6 — Agency Owner)
```

---

## Context

Agency owners have full platform access including billing, branding, white-label, team role management, AI Designer, and client impersonation. They are the primary paying customers of DRAMAC.

---

## Task 1: Full Onboarding (First-Time Owner)

### Files to Audit
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/onboarding/page.tsx`
- `src/lib/actions/onboarding.ts`
- `src/lib/actions/agency.ts`

### Requirements
1. **Signup**: Create account → Auto-creates agency with owner role
2. **Onboarding wizard**: Agency name, industry, goals, first site (optional), product tour
3. **Agency creation**: Creates `agencies` row + `agency_members` with role = "owner"
4. **First site**: Optionally creates first site during onboarding
5. **All saves real**: Everything persists to DB
6. **Redirect**: After onboarding → `/dashboard`

### What to Fix
- If agency isn't created on signup — verify agency creation logic
- If onboarding steps don't save — wire each step to real DB update
- If first site creation fails — verify site creation logic
- If product tour is broken — ensure it loads or skip gracefully

### Verification
```
□ Signup → Account created + agency created + owner role set
□ Onboarding → All steps save to DB
□ First site → Created if selected
□ After onboarding → Lands on dashboard
```

---

## Task 2: Billing & Subscription Management

### Files to Audit
- `src/app/(dashboard)/settings/billing/page.tsx`
- `src/app/(dashboard)/settings/subscription/page.tsx`
- `src/app/(dashboard)/dashboard/billing/page.tsx`
- `src/app/(dashboard)/dashboard/billing/success/page.tsx`
- `src/lib/actions/billing.ts`
- `src/app/api/billing/*`
- `src/app/api/webhooks/paddle/route.ts`
- `src/lib/paddle/*` (if exists)

### Requirements
1. **View plan**: Current subscription plan and usage details
2. **Upgrade/downgrade**: Plan change flow via Paddle checkout
3. **Payment methods**: View/update payment methods
4. **Invoice history**: Real invoices from billing provider
5. **Cancel subscription**: With confirmation and grace period info
6. **Billing dashboard**: Revenue overview, module costs
7. **Success page**: After successful payment
8. **Webhooks**: Paddle webhooks update subscription status in DB
9. **All pricing in ZMW**: `formatCurrency()` from locale-config
10. **Dunning**: Payment failure → notification + retry flow

### What to Fix
- If plan details are hardcoded — query from `subscriptions` table or Paddle API
- If payment method update is stubbed — implement Paddle update payment method
- If invoice history is mocked — query from billing provider or show "via Paddle dashboard" link
- If cancel doesn't work — implement subscription cancellation
- If webhooks don't update status — verify webhook handler
- If pricing shows `$` — change to `formatCurrency()`

### Verification
```
□ Current plan shows correctly
□ Upgrade flow works (or clear Paddle checkout redirect)
□ Payment method update works
□ Invoice history shows real data (or link to provider)
□ Cancel subscription flow works
□ All amounts in ZMW
□ Payment success page works
□ Webhook updates subscription status
```

---

## Task 3: White-Label & Branding

### Files to Audit
- `src/app/(dashboard)/settings/branding/page.tsx`
- `src/components/settings/branding-settings-form.tsx`
- `src/components/providers/branding-provider.tsx`
- `src/components/providers/server-branding-style.tsx`
- `src/app/api/branding/[agencyId]/route.ts`
- `src/styles/brand-variables.css`

### Requirements
1. **Logo upload**: Light and dark variants, saved to Supabase Storage
2. **Brand colors**: Primary, secondary, accent — applied via CSS variables
3. **Custom favicon**: Upload and serve custom favicon
4. **White-label toggle**: Remove DRAMAC branding when enabled
5. **Branding preview**: Live preview of color changes
6. **SSR injection**: `ServerBrandingStyle` prevents color flash
7. **Branding save**: Instant persistence + `branding-updated` event dispatch
8. **Portal branding**: Same branding appears in client portal (no flash)
9. **Email branding**: Custom logo/colors in email templates
10. **All saves real**: Write to `agencies.custom_branding` JSONB field

### What to Fix
- If logo upload doesn't save — wire to Supabase Storage + update agency record
- If colors don't apply — verify CSS variable injection path
- If branding flash occurs — verify `ServerBrandingStyle` in both dashboard and portal layouts
- If white-label toggle doesn't work — verify `white_label_enabled` flag is used
- If email branding doesn't work — include agency branding in email template context

### Verification
```
□ Logo upload → Persists, shows in sidebar
□ Color changes → Applied instantly via CSS vars
□ Page reload → No branding flash (SSR injection works)
□ Portal shows same branding
□ White-label toggle removes DRAMAC branding
□ Email templates include agency branding
□ Favicon updates correctly
```

---

## Task 4: Team Role Management

### Files to Audit
- `src/app/(dashboard)/settings/team/page.tsx`
- `src/lib/actions/team.ts`

### Requirements
1. **Change roles**: Owner can change member ↔ admin
2. **Transfer ownership**: Owner can transfer to another admin
3. **Remove members**: Owner can remove any member
4. **Role restrictions**: Only owner can change roles and transfer ownership
5. **Activity log**: Team changes logged in activity

### What to Fix
- If role changes don't save — wire to `agency_members` update
- If ownership transfer doesn't work — implement atomic transfer
- If non-owner can change roles — add role check guard

### Verification
```
□ Owner can change member ↔ admin
□ Ownership transfer works
□ Non-owner cannot change roles
□ Remove member works
□ Activity logged for team changes
```

---

## Task 5: AI Website Designer

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/ai-designer/page.tsx`
- `src/app/api/ai/website-designer/route.ts` (or variants)
- `src/lib/studio/ai-designer/engine.ts`
- `src/lib/studio/ai-designer/converter.ts`
- `src/lib/studio/ai-designer/prompts.ts`
- `src/lib/studio/ai-designer/config/color-intelligence.ts`
- `src/lib/studio/ai-designer/design/variety-engine.ts`
- `src/lib/studio/ai-designer/quality/design-auditor.ts`

### Requirements
1. **Business input**: Business name, industry, description, services, brand colors
2. **AI generation**: Streams page generation (Claude via AI SDK)
3. **Multi-page**: Generates Homepage, About, Services, Contact, Blog (+ industry-specific)
4. **Preview**: Device frames (desktop/mobile/tablet) with CSS transform:scale()
5. **Save & Apply**: Creates pages in Studio, auto-installs required modules
6. **Design variety**: Different designs via variety engine (not same every time)
7. **Color system**: WCAG-compliant palettes from color-intelligence
8. **Quality audit**: Post-generation quality check (design-auditor)
9. **Module integration**: Auto-detects industry → installs booking/ecommerce modules
10. **Theme tokens**: `setDesignTokens()` before conversion, all components themed

### What to Fix
- If AI generation fails — check Anthropic API key and model configuration
- If preview doesn't scale — verify PreviewCanvas component
- If save doesn't create pages — verify Studio page creation action
- If modules aren't auto-installed — verify auto-install API call
- If every site looks the same — verify variety-engine is active
- If colors are wrong — verify `setDesignTokens()` flow

### Verification
```
□ Enter business details → AI generates pages
□ Preview shows correctly with device frames
□ Mobile/tablet/desktop previews work
□ Save & Apply → Pages created in Studio
□ Booking module auto-installed for relevant industries
□ Different businesses get different designs
□ Colors match brand input
□ All text is relevant to the business (no "Professional solutions")
```

---

## Task 6: Studio Visual Page Builder

### Files to Audit
- `src/app/studio/[siteId]/[pageId]/page.tsx`
- `src/components/studio/*`
- `src/lib/studio/store/*`
- `src/lib/studio/registry/*`
- `src/lib/studio/engine/renderer.tsx`

### Requirements
1. **Full-screen editor**: Loads at `/studio/[siteId]/[pageId]`
2. **Component library**: Left panel shows all available components
3. **Drag & drop**: Components can be dragged from library to canvas
4. **Property editing**: Right panel shows component properties
5. **Responsive preview**: Mobile/tablet/desktop toggle
6. **Save**: Saves page content JSON to `pages` table
7. **Undo/Redo**: Ctrl+Z/Y works
8. **AI assistant**: Per-component AI suggestions
9. **Module components**: Booking/E-Commerce components available if modules installed
10. **Publish**: Page can be published/unpublished

### What to Fix
- If Studio doesn't load — check store initialization
- If drag & drop doesn't work — verify dnd-kit setup
- If save doesn't persist — verify server action
- If module components don't show — verify `getSiteEnabledModules()` check
- If undo/redo doesn't work — verify zundo history

### Verification
```
□ Studio loads in full-screen
□ Component library shows components
□ Drag & drop works
□ Properties panel shows editable fields
□ Save → Content persists to DB
□ Undo/Redo works
□ Responsive preview works
□ Module components show when modules installed
```

---

## Task 7: Automation Workflows

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/automation/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/automation/workflows/*`
- `src/app/(dashboard)/dashboard/sites/[siteId]/automation/executions/*`
- `src/app/(dashboard)/dashboard/sites/[siteId]/automation/templates/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/automation/connections/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/automation/analytics/page.tsx`
- `src/modules/automation/actions/automation-actions.ts`
- `src/modules/automation/components/WorkflowBuilderEnhanced.tsx`
- `src/modules/automation/components/workflow-builder/*`

### Requirements
1. **Workflow list**: Shows all workflows for the site from DB
2. **Create workflow**: Visual builder with triggers, conditions, actions
3. **Edit workflow**: Pre-fills existing workflow data
4. **Test workflow**: Triggers test execution → `executeWorkflow()` called
5. **Workflow templates**: Pre-built templates available
6. **Connections**: Connected services management
7. **Execution log**: Real execution history from DB
8. **Execution detail**: Step-by-step execution timeline
9. **Analytics**: Workflow performance metrics from real data
10. **All data real**: No "coming soon" toasts for functional features

### What to Fix
- If workflow creation doesn't save — wire to DB
- If test run doesn't execute — verify `triggerWorkflow()` → `executeWorkflow()` flow
- If execution log is empty — query from `automation_executions` table
- If templates are hardcoded — make them real or provide good defaults
- If connections page is stubbed — wire to `automation_connections` table
- If analytics is mocked — query real execution data
- Remove any remaining "coming soon" toasts for implemented features

### Verification
```
□ Create workflow → Saved to DB
□ Edit workflow → Changes persist
□ Test workflow → Execution created and runs
□ Execution log shows real executions
□ Execution detail shows step timeline
□ Connections management works
□ Analytics shows real data (or zeros)
□ No "coming soon" on functional features
```

---

## Task 8: Social Media Management

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/social/*` (all sub-routes)
- `src/modules/social-media/components/*`
- `src/modules/social-media/actions/*`
- `src/lib/actions/social-analytics.ts`

### Requirements
1. **Compose**: Create and schedule social posts
2. **Calendar**: Content calendar view
3. **Inbox**: Social inbox (messages/comments)
4. **Campaigns**: Campaign management
5. **Approvals**: Content approval queue
6. **Accounts**: Connected social accounts (with clear "Connect" status)
7. **Analytics**: Real social engagement data from DB (not seededRandom)
8. **Settings**: Social preferences
9. **Connect buttons**: Show "Coming Soon" badge or real OAuth connect

### What to Fix
- If analytics uses `seededRandom()` — replace with real DB queries
- If compose doesn't save — wire to DB
- If calendar is mocked — show real scheduled posts
- If connect buttons use `alert()` — should use `toast.info()` or Badge
- If campaigns are fully mocked — show real data or clear empty state

### Verification
```
□ Compose → Post saved/scheduled in DB
□ Calendar shows real scheduled posts
□ Analytics shows real data (or zeros)
□ Connect accounts → Clear status (connected or "Coming Soon")
□ No alert() calls anywhere
□ No seededRandom data
```

---

## Task 9: CRM Module

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/crm-module/*`
- `src/app/(dashboard)/dashboard/crm/page.tsx`
- `src/modules/crm/actions/*`
- `src/modules/crm/components/*`
- `src/lib/actions/crm-analytics.ts`

### Requirements
1. **Contacts**: CRUD for contacts in `mod_crmmod01_contacts` table
2. **Companies**: CRUD for companies in `mod_crmmod01_companies` table
3. **Deals**: Pipeline view with drag-and-drop stages
4. **Deal creation**: With real deal fields, amounts in ZMW
5. **Activity tracking**: Log calls, emails, meetings per contact
6. **Analytics**: Revenue, pipeline, deal velocity — all from real data
7. **CSV export**: Export contacts to CSV
8. **Agency CRM**: Multi-site CRM at `/dashboard/crm`
9. **CRM sidebar navigation**: Links use `/crm-module` (not `/crm`)

### What to Fix
- If CRM analytics uses `seededRandom()` — replace with real queries on `mod_crmmod01_*`
- If deal amounts show `$` — change to `formatCurrency()`
- If pipeline drag-and-drop doesn't save — wire to real DB update
- If CSV export is stubbed — implement real CSV generation
- If navigation uses `/crm` — change to `/crm-module`
- If contacts show mock data — query from real CRM tables

### Verification
```
□ Contacts CRUD works (create/edit/delete)
□ Companies CRUD works
□ Deal pipeline drag-and-drop works
□ Deal amounts in ZMW
□ Analytics shows real data (or zeros)
□ CSV export works
□ Navigation uses /crm-module paths
□ Agency CRM shows multi-site data
```

---

## Task 10: Client Impersonation

### Files to Audit
- Client detail page → "View as Client" button
- Portal layout → impersonation detection
- Cookie management for `impersonating_client_id`

### Requirements
1. **Impersonate button**: On client detail page, "View as Client" link
2. **Set cookie**: Sets `impersonating_client_id` cookie
3. **Portal view**: Redirected to portal, sees exactly what client sees
4. **Exit button**: "Exit Impersonation" button visible during impersonation
5. **Exit**: Clears cookie, returns to agency dashboard

### What to Fix
- If impersonate button missing — add to client detail page
- If portal doesn't detect impersonation — check cookie reading
- If exit button missing — add visible exit impersonation bar
- If impersonation doesn't show correct client data — verify client ID filtering

### Verification
```
□ "View as Client" button on client detail page
□ Clicking → Redirects to portal with client context
□ Portal shows client's assigned sites
□ "Exit Impersonation" button visible
□ Exit → Returns to agency dashboard
```

---

## Summary: Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 10 tasks verified
□ Full onboarding works end-to-end
□ Billing shows real data
□ Branding changes apply everywhere (no flash)
□ AI Designer generates correctly
□ Studio works fully
□ Automation workflows work
□ Social media pages work
□ CRM works with real data
□ Client impersonation works
□ All currency in ZMW
□ All dates in Africa/Lusaka timezone
□ No mock data anywhere
```
