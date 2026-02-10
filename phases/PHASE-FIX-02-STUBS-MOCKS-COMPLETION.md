# PHASE-FIX-02: Stubs, Mocks & Non-Functional Features Completion

**Priority:** 🟠 HIGH — Addresses fake data, TODO stubs, "Coming Soon" placeholders  
**Estimated Scope:** ~35 files modified, 5 new files created  
**Dependencies:** Phase FIX-01 (currency provider) should ideally be done first for correct formatting, but this phase can run independently if needed  
**Runs Independently:** YES — if Phase FIX-01 is not yet done, use `import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/locale-config'` as the currency formatter instead of `useAgencyCurrency()`

---

## ⚠️ AI IMPLEMENTATION INSTRUCTIONS

> **READ BEFORE IMPLEMENTING.** This phase is designed to run in a NEW session where the AI has no prior context. Follow these rules strictly:

### Session Setup
1. **Read ALL memory bank files first** (`/memory-bank/*.md`)
2. **Pay special attention to** `systemPatterns.md` → Email/Notification pattern (single pipeline, no dual emails)
3. **Run `npx tsc --noEmit`** before AND after implementation

### Critical Technical Context
- **Notification pattern**: `createNotification()` is IN-APP ONLY. For email, use `sendEmail()` separately. The orchestrator in `business-notifications.ts` handles both. See `systemPatterns.md` for the full pattern.
- **Supabase clients**: Dashboard = `createClient()`, Public/Webhook = `createAdminClient()`. NEVER use inline `createClient(URL, SERVICE_ROLE_KEY)` — always use the helper from `@/lib/supabase/admin`.
- **Social analytics** (`social-analytics.ts`): The entire file (~800 lines) uses `seededRandom()`. Replace ALL functions with proper empty-state returns (zeros + `connected: false`).
- **Admin analytics** (`admin-analytics.ts`): Also uses `generateSeededRandom()` — same treatment needed. Return real DB queries or zeros.
- **Admin settings** (`admin/settings/page.tsx`): ALL 6 sections are wrapped in `opacity-60 pointer-events-none`. Remove these wrappers but only enable sections that can actually save data.
- **Studio HTML export**: The `generatePageHTML()` in publishing actions renders a placeholder comment. This needs real component-tree-to-HTML serialization.

### Conflict Prevention
- **DO NOT modify currency formatting** — that's Phase FIX-01's responsibility. If you encounter hardcoded `$`, leave it for Phase FIX-01 or use `formatCurrency()` from `locale-config.ts`.
- **DO NOT modify navigation configs** (`settings-navigation.ts`, `admin-navigation.ts`) — that's Phase FIX-03's responsibility.
- **DO NOT modify `globals.css`**, `tailwind.config.ts`, or `branding-provider.tsx` — those belong to Phase FIX-01.
- **DO NOT delete or move route files** — that's Phase FIX-03's responsibility.
- This phase's scope is: server actions, API route stubs, component enable/disable states, data functions, and feature completion.

### Verification Gate
After completing ALL tasks, run:
```bash
cd next-platform-dashboard
npx tsc --noEmit
```
If zero errors: `git add -A && git commit -m "feat: Phase FIX-02 — stubs, mocks, and feature completion" && git push`

---

## Problem Statement

A comprehensive platform audit found **49 issues** across the platform: 6 P0 (broken/crashes), 40 P1 (stubbed/not-implemented), 3 P2 (cosmetic). Major areas include:

- **Social media analytics** — 800+ lines of `seededRandom()` fake data (21 functions)
- **Admin platform analytics** — 1,134 lines of `generateSeededRandom()` fake data (revenue, uptime, agencies, billing — ALL fabricated)
- **Admin settings** — entire page disabled with `opacity-60 pointer-events-none`
- **Automation connections** — all fetch/save/test functions are fake
- **PDF generation** — quotes and invoices return null/HTML instead of PDF
- **Ecommerce** — shipping always $0, 7 integrations "Coming Soon", checkout incomplete
- **CRM** — CSV export stub, pipeline stage management disabled, agency dashboard stub
- **Studio** — HTML export placeholder, media library stub, symbol editor stub
- **AI agents** — Google/Ollama providers throw errors, approval flow bypassed
- **Portal** — 2FA disabled, session management disabled, PDF download disabled

---

## Task 1: Social Media Analytics — Remove ALL Mock Data

**Files:** `src/lib/actions/social-analytics.ts` (~800 lines)

**Current State:** Every single function (21+) uses `seededRandom()` to generate fabricated follower counts, engagement rates, reach metrics, hashtag performance, etc. Zero real data.

**Fix Options (choose one):**

### Option A: Show Real Empty State (Recommended for MVP)
Replace all `seededRandom()` functions with proper empty-state returns. Each function returns `[]` or `{ value: 0 }` with a consistent shape. The UI should show "Connect your social accounts to see analytics" empty states.

```typescript
// BEFORE:
export async function getSocialOverview(siteId: string) {
  // 200 lines of seededRandom() generating fake followers, likes, etc.
  return { followers: seededRandom(1000, 50000), ... }
}

// AFTER:
export async function getSocialOverview(siteId: string) {
  // When real social integrations are built, query from social_accounts + social_metrics tables
  return { followers: 0, following: 0, posts: 0, engagement_rate: 0, connected: false }
}
```

### Option B: Wire to Real Social APIs (Future Phase)
This requires OAuth integration with Facebook Graph API, Instagram Basic Display API, Twitter/X API, etc. — scope of a full phase, not this fix.

**Recommendation:** Option A — return zeros/empty with `connected: false` flag, update UI to show connection prompts.

**Also fix UI files:**
- `src/components/analytics/social/content-analytics.tsx` — show empty state when `connected: false`
- `src/modules/social-media/components/ui/*.tsx` — show "Connect Account" CTA when no data
- Social accounts pages — remove `alert('OAuth coming soon!')`, show proper "Coming Soon" UI with explanation

---

## Task 2: Admin Platform Analytics — Remove ALL Mock Data

**File:** `src/lib/actions/admin-analytics.ts` (~1,134 lines)

**Current State:** Defines `generateSeededRandom()` at line ~180 and uses it 21+ times. ALL platform metrics are fabricated:
- Plan distribution (free/starter/pro percentages)
- User activity (hardcoded 70% active ratio)
- Agency metrics (active/trial/churned — all random)
- System health (uptime, latency, error rate, sessions — ALL fake, services hardcoded as "operational")
- Agency billing & engagement (revenue, payment status, login counts, health scores — ALL seeded-random)
- Trend data (revenue, page views — random)

**Fix:**
1. Remove `generateSeededRandom()` function entirely
2. Replace each analytics function with real Supabase queries:
   - Plan distribution → `SELECT plan_id, COUNT(*) FROM subscriptions GROUP BY plan_id`
   - User activity → `SELECT COUNT(*) FROM profiles WHERE last_sign_in_at > NOW() - INTERVAL '30 days'`
   - Agency metrics → `SELECT COUNT(*) FILTER (WHERE status = 'active'), COUNT(*) FILTER (WHERE status = 'trial') FROM agencies`
   - System health → Return honest "Analytics integration required" with zeros, NOT fake "99.9% uptime"
   - Trend data → Query actual `module_subscriptions` and `sites` creation over time
3. Where real queries aren't possible (e.g., server latency), return zeros with a clear `dataSource: 'placeholder'` flag
4. Update admin dashboard UI to show "Configure monitoring integration" for system health instead of fake stats

---

## Task 3: Admin Settings — Enable the Page

**File:** `src/app/(dashboard)/admin/settings/page.tsx`

**Current State:** ALL 6 sections (General, Email, Notifications, Security, Database, Domains) wrapped in `opacity-60 pointer-events-none`. Every control is `disabled`. The admin cannot configure anything.

**Fix:**
1. Remove `opacity-60 pointer-events-none` wrapper divs
2. Remove `disabled` props from all controls
3. Wire form submission to save to an `admin_settings` table or similar
4. If some sections genuinely aren't ready, keep those specific sections disabled with a clear "Phase X" label, but enable the ones that CAN work (General, Email at minimum)

**If no `admin_settings` table exists:**
- Create migration: `CREATE TABLE admin_settings (key TEXT PRIMARY KEY, value JSONB, updated_at TIMESTAMPTZ DEFAULT NOW())`
- Wire save to upsert into this table
- Wire load to read from this table

---

## Task 4: Automation Connection System — Wire to Database

**File:** `src/modules/automation/components/settings/connection-settings.tsx` (or equivalent)

**Current State:** Lines 707-791 — `fetchConnections()`, `disconnectConnection()`, `saveConnection()`, `testConnection()` all have `// TODO: Replace with actual API call` comments. Save creates fake `conn-${Date.now()}` IDs. Test always returns `true` after 1.5s delay.

**Fix:**
1. Create `automation_connections` table if it doesn't exist:
```sql
CREATE TABLE IF NOT EXISTS automation_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES agencies(id),
  site_id UUID REFERENCES sites(id),
  provider TEXT NOT NULL, -- 'zapier', 'webhook', 'make', etc.
  name TEXT,
  config JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
2. Wire `fetchConnections()` → `SELECT FROM automation_connections`
3. Wire `saveConnection()` → `INSERT/UPDATE INTO automation_connections`
4. Wire `disconnectConnection()` → `DELETE FROM automation_connections`
5. Wire `testConnection()` → actually test the endpoint (for webhooks: send a ping)

---

## Task 5: Workflow "Coming Soon" Stubs — Enable or Remove

**Files:**
- Workflow test run: `toast.info("Test run feature coming soon!")` → implement test run or remove button
- Workflow duplicate: `toast.info('Duplicate feature coming soon!')` → implement clone or remove button
- Workflow test/run buttons: Both show "coming soon!" → implement or hide

**Fix approach:** For each stub, either:
- **Implement it** (e.g., workflow duplicate = copy the workflow JSON to a new row with "(Copy)" suffix)
- **Hide the button** until implemented (don't show broken controls to users)

---

## Task 6: PDF Generation — Install Library & Wire Up

**Files:**
- `src/modules/ecommerce/lib/quote-pdf.ts` — `generateQuotePDF()` returns `null`
- Portal quote detail — "PDF download coming soon" disabled button
- Developer payout statement — returns HTML instead of PDF

**Fix:**
1. Install `@react-pdf/renderer` or `jspdf` + `html2canvas`:
   ```bash
   pnpm add @react-pdf/renderer
   ```
2. Implement `generateQuotePDF()` — create a PDF template with:
   - Agency branding (logo, name, colors)
   - Quote details (items, prices, totals)
   - Customer info
   - Terms & conditions
   - Return as `Buffer` or `Blob`
3. Wire the portal download button to call the API and trigger download
4. Wire the payout statement to generate actual PDF

---

## Task 7: Ecommerce Fixes

### 6a: Shipping Calculation
**File:** Checkout route (shipping hardcoded to `0`)
```typescript
// BEFORE:
const shipping = 0 // TODO: Calculate based on shipping method

// AFTER:
const shipping = await calculateShipping(items, shippingAddress, siteId)
// If no shipping rules configured, default to 0 (free shipping)
```

Create `calculateShipping()` function that reads from site's shipping configuration.

### 6b: Integration Coming Soon Badges
**File:** Ecommerce integrations settings
- 7 integrations (PayPal, ShipStation, Klaviyo, Xero, Facebook Pixel, Zendesk, HubSpot) show "Coming Soon"
- **Fix:** Keep as "Coming Soon" but make the UI cleaner — show a proper "Integration Roadmap" section with expected dates, not disabled toggle switches

### 6c: Ecommerce Analytics Charts
**File:** Where "Charts coming soon - Install Recharts" message shows
- Recharts IS installed (`recharts` in dependencies). The component just doesn't render charts.
- **Fix:** Import `ResponsiveContainer`, `AreaChart`, `BarChart` from recharts and render actual analytics charts from the existing data

---

## Task 8: CRM Fixes

### 7a: CSV Export
**File:** CRM contacts/deals view
```typescript
// BEFORE:
// TODO: Implement CSV export

// AFTER:
function exportToCSV(data: Contact[] | Deal[]) {
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(item => Object.values(item).map(v => `"${v}"`).join(','))
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'export.csv'; a.click()
}
```

### 7b: Pipeline Stage Management
- Replace "Stage management coming soon" with actual UI to add/remove/reorder stages

### 7c: Agency CRM Dashboard
- Replace TODO stub with real aggregate queries across all sites

---

## Task 9: Studio Fixes

### 8a: HTML Export
**File:** Studio export function
- Currently outputs `<!-- Page content rendered here -->` placeholder
- **Fix:** Implement proper HTML serialization from the Studio component tree

### 8b: Media Library Integration
**File:** Studio image picker
- Currently shows `alert('Media Library integration coming in future phase')`
- **Fix:** Open the existing media library dialog (the media library page exists at `/dashboard/media`)

### 8c: Symbol Editor
- Currently `// TODO: Open symbol editor` → implement or remove the button

---

## Task 10: Booking Payment Integration

**File:** Booking module settings / checkout flow

**Current State:** "Payment integration coming soon." — bookings are created but no payment is collected.

**Fix Options:**
- **Option A:** Wire to Paddle for booking payments (complex, requires checkout session)
- **Option B:** Mark as "Free Booking" explicitly and add a "Paid bookings coming in Phase X" notice
- **Option C:** Allow manual payment recording (staff marks payment as received)

**Recommendation:** Option C — add a "Payment Status" field to appointments (unpaid/paid/partial) with manual toggle.

---

## Task 11: Portal Security Features

### 10a: 2FA — Show Proper "Not Available" State
- Currently shows "Coming Soon" badge — make it clearer this is a planned feature
- Option: Implement TOTP 2FA using Supabase Auth MFA

### 10b: Session Management
- "View Sessions" button is disabled
- **Fix:** Either implement session listing from Supabase Auth sessions or remove the button

---

## Task 12: Webhook Signature Verification

**File:** Automation webhook handler

**Current State:** `// TODO: Implement signature verification` — webhooks accept ANY payload without authentication.

**Fix:**
```typescript
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expected = hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

---

## Task 13: AI Agent Provider Stubs

**Files:** AI agent provider files

**Current State:**
- Google provider: `throw new Error('Google AI provider not yet implemented')`
- Local/Ollama provider: `throw new Error('Ollama provider not yet implemented')`

**Fix:** Either implement or gracefully handle:
```typescript
// Instead of throwing, return a user-friendly error
throw new UserFacingError('Google AI provider is not yet available. Please use Anthropic (Claude) as your AI provider.')
```

Also fix:
- Approval flow: `// TODO: Implement approval flow` → implement or log warning
- Permission checking: `// TODO: Implement proper permission checking` → implement basic role check

---

## Task 14: Screenshot API

**File:** `src/app/api/screenshot/route.ts`

**Current State:** Returns an SVG placeholder instead of an actual screenshot.

**Fix Options:**
- **Option A:** Use Puppeteer/Playwright (requires server-side execution environment)
- **Option B:** Use a screenshot API service (screenshotapi.net, urlbox.io)  
- **Option C:** Use a static placeholder image that looks professional (not a sketch SVG)

**Recommendation:** Option C for now, Option B when ready for production screenshot service.

---

## Verification Checklist

- [ ] Social media analytics shows "Connect your accounts" instead of fake data
- [ ] Admin settings page is interactive (at least General + Email sections)
- [ ] Automation connections persist to database
- [ ] No "Coming Soon" toasts on workflow test/duplicate (hidden or working)
- [ ] Quote PDF can be downloaded from portal
- [ ] Shipping calculation works or shows "Free Shipping" explicitly
- [ ] CRM CSV export downloads a file
- [ ] Studio HTML export generates actual HTML
- [ ] Media library button opens existing media library
- [ ] Booking shows payment status field
- [ ] Webhook signature verification is active
- [ ] AI agent gracefully handles unavailable providers
- [ ] `tsc --noEmit` returns zero errors

---

## Files Affected Summary

| Action | Count |
|--------|-------|
| **Modify** | ~35 files (analytics, automation, ecommerce, CRM, studio, booking, portal, AI, admin) |
| **Create** | ~5 files (PDF templates, shipping calculation, admin settings migration, CSV export utility) |
| **Total** | ~40 files |

---

## Priority Order

1. **Social analytics de-mock** (most visible — entire social dashboard is fake)
2. **Admin settings enable** (platform admin can't configure anything)
3. **Currency $ fixes** (handled in Phase FIX-01 but some overlap here)
4. **PDF generation** (customers can't download quotes)
5. **Ecommerce analytics charts** (Recharts IS installed, just needs wiring)
6. **CRM CSV export** (quick win)
7. **Automation connections** (needs DB table)
8. **Studio fixes** (media library, HTML export)
9. **Everything else** (portal security, AI providers, screenshots)
