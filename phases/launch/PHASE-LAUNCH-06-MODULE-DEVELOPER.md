# PHASE LAUNCH-06: Module Developer Journey E2E

**User Journeys Covered**: 7.1 (Developer Profile), 7.2 (Build Module — In-Browser), 7.3 (AI Builder), 7.4 (VS Code + CLI), 7.5 (Publish & Versions), 7.6 (Revenue & Payouts), 7.7 (Monitor Performance)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: Published modules appear in LAUNCH-10 (Module Marketplace Lifecycle)

---

## Pre-Implementation: Read These Files First

```
memory-bank/projectbrief.md (Module Types, Revenue Sharing sections)
memory-bank/systemPatterns.md (Module Architecture section)
docs/USER-JOURNEYS.md (Section 7 — Module Developer)
```

---

## Context

Module developers build and publish modules to the DRAMAC marketplace. They can be standalone developers or agency owners who also develop. They use the Module Studio (in-browser), AI Builder, or VS Code + CLI (packages/dramac-cli, packages/sdk).

**Auth**: Standard Supabase login.  
**Profile**: Requires `developer_profiles` record.  
**Revenue**: 70/30 split (Developer/Platform).

---

## Task 1: Developer Profile Setup

### Files to Audit
- Developer profile pages (check `src/components/developer/*`)
- `src/app/api/developer/payout-account/route.ts`
- `src/app/api/developer/stripe-connect/route.ts`
- `developer_profiles` table queries

### Requirements
1. **Create profile**: Developer name, slug, avatar, bio, website, social links
2. **Payout setup**: Connect payout account (Paddle/Payoneer/Wise integration)
3. **Verification**: Optional developer verification request
4. **Profile page**: Public developer profile visible in marketplace
5. **All saves real**: Write to `developer_profiles` table

### What to Fix
- If developer profile creation doesn't save — wire to real DB insert
- If payout setup is stubbed — implement or show clear integration path
- If verification doesn't work — implement status tracking or show "coming soon"
- If profile is fully mocked — query from real `developer_profiles` table

### Verification
```
□ Create developer profile → Saved to DB
□ Edit profile → Changes persist
□ Payout account setup works (or clear integration status)
□ Profile visible in module detail pages
```

---

## Task 2: Build Module (In-Browser Studio)

### Files to Audit
- `src/app/(dashboard)/admin/modules/studio/page.tsx`
- `src/app/(dashboard)/admin/modules/studio/new/page.tsx`
- `src/app/(dashboard)/admin/modules/studio/[moduleId]/page.tsx`
- `src/app/(dashboard)/admin/modules/studio/[moduleId]/test/page.tsx`
- Monaco editor integration
- Module file management actions

### Requirements
1. **Module Studio**: In-browser IDE with Monaco editor
2. **Create module**: Name, description, icon, category, tags, type, install level, pricing
3. **Code editing**: React component code (render_code), CSS/Tailwind (styles), settings schema, API routes, default settings
4. **Manifest editor**: render_mode, permissions, dependencies, version info
5. **File management**: Create/edit/delete module files
6. **Test module**: Preview rendering, test API endpoints, view test results
7. **Save**: All code and metadata saved to `module_source` + `module_versions` tables
8. **Real Monaco**: Full syntax highlighting, autocomplete, error checking

### What to Fix
- If Monaco editor doesn't load — check dynamic import
- If code doesn't save — wire to real DB insert/update
- If test preview doesn't render — verify module rendering pipeline
- If settings schema doesn't save — ensure JSON serialization
- If module type/category selectors are empty — populate with real options

### Verification
```
□ Module Studio loads with Monaco editor
□ Create new module → Metadata saved to DB
□ Code editing → Changes saved
□ Test module → Preview renders
□ Settings schema works
□ Module files manageable (create/edit/delete)
```

---

## Task 3: Build Module (AI Builder)

### Files to Audit
- `src/app/(dashboard)/admin/modules/studio/ai-builder/page.tsx` (or path variants)
- `src/app/api/modules/ai-builder/chat/route.ts`
- `src/app/api/modules/ai-builder/generate-spec/route.ts`
- `src/app/api/modules/ai-builder/generate-code/route.ts`
- `src/app/api/modules/ai-builder/refine/route.ts`
- `src/app/api/modules/ai-builder/finalize/route.ts`

### Requirements
1. **Chat interface**: Conversational AI to describe module requirements
2. **Spec generation**: AI generates module specification from description
3. **Code generation**: AI generates React component code, styles, API routes
4. **Refinement**: Iterate on generated code via chat
5. **Finalize**: Convert generated code to module package
6. **Review**: Developer reviews generated code in Studio editor
7. **API calls**: Use Claude via AI SDK (Anthropic provider)

### What to Fix
- If AI chat doesn't work — check API route configuration and AI SDK setup
- If spec generation fails — verify prompt templates
- If code generation produces invalid code — check Claude model and prompts
- If finalize doesn't save — wire to module creation flow
- If any API route returns mock data — implement real AI calls

### Verification
```
□ Chat interface works (send message → get AI response)
□ Spec generation produces reasonable module spec
□ Code generation produces valid React code
□ Refinement loop works (ask for changes → updated code)
□ Finalize → Module created in Studio
□ Generated code viewable in Monaco editor
```

---

## Task 4: Publish & Version Management

### Files to Audit
- Module publish flow
- `src/app/api/modules/[moduleId]/versions/route.ts` (or variants)
- Version management actions
- Module review/approval system

### Requirements
1. **Publish to marketplace**: Submit module for marketplace listing
2. **Version numbering**: Semantic versioning (major.minor.patch)
3. **Changelog**: Write changelog per version
4. **Version list**: All versions visible in module detail
5. **Rollback**: Ability to roll back to previous version
6. **Review system**: Optional review before publishing (for third-party modules)
7. **Module data**: Stored in `modules_v2` + `module_versions` tables

### What to Fix
- If publish doesn't update `modules_v2` status — wire to real DB update
- If version tracking doesn't work — verify `module_versions` insert
- If rollback is stubbed — implement or show clear status
- If changelog doesn't save — store in version record

### Verification
```
□ Publish module → Listed in marketplace
□ Version number increments correctly
□ Changelog saved per version
□ Version list shows all versions
□ Rollback to previous version works (or clear status)
```

---

## Task 5: Revenue & Payouts

### Files to Audit
- `src/app/api/developer/revenue/route.ts`
- `src/app/api/developer/payouts/route.ts`
- `src/app/api/developer/statements/route.ts`
- `src/app/api/developer/revenue/export/route.ts`
- `src/components/developer/*`
- Revenue dashboard components

### Requirements
1. **Revenue dashboard**: Total earnings, monthly trend (real data from DB)
2. **Revenue per module**: Breakdown by module
3. **Install counts**: Real install counts from `agency_module_subscriptions`
4. **Conversion rates**: Calculated from real data
5. **Payout history**: Real payout records
6. **Financial statements**: Downloadable statements
7. **Revenue export**: CSV/PDF export
8. **All amounts in ZMW**: `formatCurrency()` from locale-config
9. **70/30 split**: Clearly shown in revenue breakdown

### What to Fix
- If revenue shows mock data — query from real subscription/payment tables
- If install counts are fake — count from `agency_module_subscriptions`
- If payout history is mocked — query from real payout table or show empty state
- If amounts show `$` — change to `formatCurrency()`
- If export is stubbed — implement real CSV generation

### Verification
```
□ Revenue dashboard shows real data (or zeros)
□ Revenue per module breakdown works
□ Install counts are real
□ Payout history shows real records (or empty state)
□ All amounts in ZMW
□ Export works (CSV download)
```

---

## Task 6: Module Analytics & Monitoring

### Files to Audit
- `src/app/api/modules/analytics/[moduleId]/route.ts` (or variants)
- `src/app/api/modules/[moduleId]/reviews/route.ts`
- Module analytics components
- `src/lib/actions/admin-analytics.ts` (module analytics portions)

### Requirements
1. **Install analytics**: Total installs, active installs, install trend
2. **Load times**: Average load time from `module_analytics` table
3. **Error rates**: Error count/rate from `module_error_logs` table
4. **Usage events**: Load, action, error events from `module_usage_events`
5. **User engagement**: Time spent, interaction count
6. **Revenue per install**: Calculated from real data
7. **Reviews**: Average rating, review list from DB
8. **Respond to reviews**: Developer can respond to module reviews
9. **All data real**: No mock/seededRandom

### What to Fix
- If analytics uses mock data — query from real `module_analytics` + `module_usage_events` tables
- If error tracking is mocked — query from `module_error_logs`
- If reviews are fake — query from real reviews table (or show empty state)
- If review response doesn't save — wire to real DB insert

### Verification
```
□ Install analytics shows real data
□ Load time metrics from real data
□ Error rates from real logs
□ Usage events from real tracking
□ Reviews show real reviews (or empty state)
□ Review response saves to DB
□ No mock data anywhere
```

---

## Summary: Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 6 tasks verified
□ Developer profile creates and saves
□ Module Studio works with Monaco editor
□ AI Builder generates modules
□ Module publishing flow works
□ Revenue dashboard shows real data
□ Module analytics shows real data
□ All currency in ZMW format
□ No mock data anywhere
□ All saves persist to DB
```
