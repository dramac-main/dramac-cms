# Active Context: Current Work & Focus

**Last Updated**: January 24, 2026  
**Current Phase**: EM-50 CRM Module - ✅ COMPLETE & DEPLOYED  
**Status**: ✅ 23 OF 34 PHASES IMPLEMENTED (68%)

## Current Work Focus

### ✅ COMPLETE: Phase EM-50 CRM Module (January 24, 2026)
**Status**: ✅ FULLY FUNCTIONAL & TESTED (Commits: 489b1b3, 8042312, eb2fc23, 5f3466d, f26be02, a977a22, d45ba37, c15757d)

**Critical Bugs Fixed (January 24, 2026):**
- ✅ Fixed missing `is_active` column in `mod_crmmod01_pipelines` table (migration applied)
- ✅ Fixed React Select empty string value errors in all CRM dialogs
- ✅ Updated form submission handlers to properly handle optional fields
- ✅ All 500 Internal Server Errors resolved
- ✅ All React component errors resolved
- ✅ Fixed "Create Pipeline" button - was non-functional with empty onClick handler
- ✅ Added `CreatePipelineDialog` component for creating new pipelines
- ✅ User tested and confirmed working

**What was built:**

**Module Structure:**
- `src/modules/crm/` - Complete CRM module directory
- Types, Actions, Context, Components, API routes

**Database Migration Applied:**
- `migrations/em-50-crm-module-schema.sql` - ✅ SUCCESSFULLY APPLIED
- Tables: contacts, companies, deals, pipelines, pipeline_stages, activities, tags, custom_fields
- All tables use `mod_crmmod01_` prefix per EM-05 naming conventions
- Complete RLS policies with site-based isolation using `public.can_access_site()`
- Service role bypass policies
- Auto-update timestamps triggers
- Auto-initialization via `initializeCRMForSite()` in CRMProvider

**Navigation & Discoverability:**
- ✅ **Agency-Level Access**: Added CRM to main sidebar navigation (between Sites and Media Library)
- ✅ **Site-Level Access**: CRM tab on site detail pages (alongside Overview, Pages, Blog, Modules)
- ✅ **Agency CRM Dashboard**: `/dashboard/crm` - Overview with site selector and aggregated stats
- ✅ **Site CRM Dashboard**: `/dashboard/{siteId}/crm` - Full CRM interface per site
- ✅ **Dual Access Patterns**:
  1. Sidebar → CRM → View all sites → Click site → Site CRM
  2. Sites → Click site → CRM tab → Site CRM
- ✅ No more manual URL typing - full UI navigation flow

**Data Architecture:**
- CRM data is **site-scoped** (all tables have `site_id` column)
- Each site has isolated CRM data via RLS policies
- Agency view shows overview + links to individual site CRMs
- Future: Can implement agency-level aggregation using `agency-data-access.ts` pattern

**TypeScript Status:**
- ✅ Zero compilation errors
- ✅ All 45 files compile successfully (including agency dashboard)

**Key Patterns Established:**
- `getModuleClient()` returns `supabase as any` for dynamic module tables
- `TABLE_PREFIX = 'mod_crmmod01'` constant for dynamic table names
- Local `FormData` interfaces in dialogs keep all fields as strings, convert in handleSubmit
- Sheet components use `|| undefined` to convert null to undefined for props
- RLS policies use `public.can_access_site()` not `auth.can_access_site()`
- Auto-initialization pattern: CRMProvider useEffect checks for pipelines, creates if missing
- Agency-level navigation pattern: Main nav link + site-specific access

**Files Created/Modified (48 files):**
- `migrations/em-50-crm-module-schema.sql` - Database schema ✅ APPLIED
- `migrations/em-50-crm-add-is-active-column.sql` - Bug fix migration ✅ APPLIED
- `docs/PHASE-EM-50-CRM-SUMMARY.md` - Implementation guide
- `docs/CRM-MODULE-USER-GUIDE.md` - User documentation
- `docs/CRM-REAL-WORLD-WORKFLOW.md` - Real-world usage guide
- `docs/PHASE-EM-50-CRITICAL-FIXES.md` - Bug fix documentation
- `src/modules/crm/actions/crm-actions.ts` - Server actions (992 lines)
- `src/modules/crm/types/crm-types.ts` - Type definitions (526 lines)
- `src/modules/crm/context/crm-context.tsx` - React context with auto-init
- `src/modules/crm/components/crm-dashboard.tsx` - Main dashboard
- `src/modules/crm/components/dialogs/*.tsx` - 5 create dialogs (incl. pipeline)
- `src/modules/crm/components/sheets/*.tsx` - 3 detail sheets
- `src/modules/crm/components/views/*.tsx` - 7 list views
- `src/app/api/modules/crm/**/*.ts` - 12 API routes
- `src/app/dashboard/[siteId]/crm/page.tsx` - Site-level CRM page
- `src/app/(dashboard)/dashboard/crm/page.tsx` - Agency-level CRM page ✅ NEW
- `src/components/crm/agency-crm-dashboard.tsx` - Agency dashboard component ✅ NEW
- `src/components/sites/site-crm-tab.tsx` - Site navigation tab component
- `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx` - Added CRM tab
- `src/config/navigation.ts` - Added CRM to main sidebar ✅ NEW

**How to Use:**

**Agency-Level (Overview):**
1. Click "CRM" in the sidebar
2. View aggregated stats across all sites
3. Use site selector to filter or jump to specific site's CRM
4. Click on any site card to access its full CRM

**Site-Level (Full CRM):**
1. Go to Sites → Click on any site
2. Click the "CRM" tab OR use sidebar CRM → select site
3. CRM auto-initializes with default "Sales Pipeline" + 6 stages
4. Start creating contacts, companies, and deals
5. Use Kanban board to manage deal pipeline

**Navigation Patterns:**
- **Pattern 1**: Sidebar → CRM → Agency overview → Select/click site → Site CRM
- **Pattern 2**: Sites → Click site → CRM tab → Site CRM  
- **Pattern 3**: Direct URL: `/dashboard/crm` (agency) or `/dashboard/{siteId}/crm` (site)

**Next Phase:** EM-51 Booking Module or other Wave 5 business modules

---

### ✅ Previously: Major Platform Features Specified (January 24, 2026)

**Four major new phases fully documented:**

1. **EM-57A/B: Automation Engine** - SPECIFICATION COMPLETE
   - Custom workflow automation (chose NOT to use n8n due to $50K/year embed cost)
   - Visual workflow builder with drag-and-drop
   - 100+ pre-built nodes (triggers, actions, logic, integrations)
   - Event-driven architecture using existing `module_events` system
   - Execution engine with retry, error handling, parallel execution

2. **EM-58A/B: AI Agents** - SPECIFICATION COMPLETE
   - Autonomous AI agents for sales, support, analytics
   - Multi-agent orchestration with ReAct loop
   - Memory system (short-term, long-term, episodic, semantic)
   - Tool system with built-in + custom tools
   - LLM provider abstraction (OpenAI, Anthropic)
   - Agent marketplace and templates
   - Pricing: Free (1 agent), Starter (5 agents), Pro (unlimited)

3. **EM-59A/B: Paddle Billing** - SPECIFICATION COMPLETE
   - **Replaces LemonSqueezy** (doesn't support Zambia bank payouts)
   - Paddle → Payoneer/Wise → Zambia Bank (payout solution)
   - Simple Hybrid Pricing Model implemented:
     - **Starter**: $29/mo - 3 modules, 1,000 automation runs, 500 AI actions
     - **Pro**: $99/mo - 10 modules, 10,000 automation runs, 5,000 AI actions
     - **Enterprise**: Custom pricing, unlimited everything
   - Usage-based overage billing
   - Complete webhook handlers
   - Dunning & payment recovery
   - Migration plan from LemonSqueezy

**Key Decisions Made:**
- ❌ n8n rejected ($50K/year embed cost too high)
- ✅ Custom automation engine (full control, no licensing)
- ✅ Paddle over LemonSqueezy (Zambia payout support via Payoneer/Wise)
- ✅ Simple Hybrid Pricing (base subscription + usage overage)
- ✅ AI Agents as major revenue differentiator

---

### ✅ Previously: EM-43 Revenue Sharing Dashboard (January 23, 2026)
**Status**: ✅ COMPLETE - Full revenue dashboard implemented  
**Wave 4 Enterprise**: 4/4 COMPLETE (100%) - Wave 4 FINISHED!  
**TypeScript Compilation**: ✅ Zero errors

**What was built:**

**Database Schema (em-43-revenue-schema.sql - 528 lines):**
- `developer_payout_accounts` - Stripe Connect integration, balances, tax info
- `module_revenue_config` - Pricing (free/one-time/subscription/usage-based), revenue split
- `module_sales` - Transaction records with platform/developer amounts
- `developer_payouts` - Payout requests and processing status
- `payout_line_items` - Detailed breakdown per payout
- `module_usage_records` - Usage-based billing tracking
- `revenue_analytics_daily` - Pre-aggregated analytics cache
- RLS policies for all tables with service role bypass
- Triggers for automatic balance updates

**Services:**
- `revenue-service.ts` - Sales recording, refunds, earnings summary, analytics
- `payout-service.ts` - Stripe Connect onboarding, payouts, statements

**React Hook:**
- `use-revenue-data.ts` - Data fetching with TanStack Query, export, payout requests

**Components:**
- `RevenueChart.tsx` - Recharts area chart with tooltips

**Dashboard Page:**
- Summary cards (total earnings, pending balance, this month, paid out)
- Revenue over time chart
- Top performing modules
- Revenue by country
- Sales history table
- Payout history with statement downloads
- Stripe Connect onboarding integration
- Export functionality

**API Routes (6 endpoints):**
- `GET /api/developer/revenue` - Fetch all revenue data
- `GET /api/developer/revenue/export` - Export CSV
- `GET|POST /api/developer/payouts` - List/request payouts
- `GET|PATCH /api/developer/payout-account` - Account settings
- `GET|POST /api/developer/stripe-connect` - Stripe Connect onboarding
- `GET /api/developer/statements/[payoutId]` - Generate statement

---

### ✅ Previously: Middleware Routing Bug Fix (January 23, 2026)
**Status**: ✅ FIXED - middleware.ts now properly uses proxy.ts routing  
**Root Cause**: middleware.ts was NOT using the proxy.ts routing logic at all!
**Status**: ✅ COMPLETE - Migration deployed successfully  
**Wave 4 Enterprise**: 1/4 COMPLETE (25%)  
**Database Migration**: ✅ Deployed and tested

**Final Status:**
- Migration successfully ran on production database
- All TypeScript compilation passes (zero errors)
- Functions integrated with existing phase-59 RLS helpers
- Compatible with existing module_database_registry from EM-05

**Critical Fixes Applied:**
1. ✅ Fixed `agency_users` → `agency_members` table references (6 SQL functions, 6 TS files)
2. ✅ Removed `status='active'` checks (column doesn't exist in agency_members)
3. ✅ Used existing `module_database_registry` schema from EM-05 (table_names array)
4. ✅ Removed duplicate `is_agency_admin()` function (already exists in phase-59)
5. ✅ Fixed ON CONFLICT to use existing unique constraints

**What was built:**
- Complete data isolation with Agency → Client → Site hierarchy
- RLS (Row-Level Security) enforcement at database level
- Tenant context management for server and client
- Cross-module access control with permission registry
- Data export/import with tenant isolation
- React hooks and provider for tenant context
- Agency-level admin data access

**Files Created:**
- `migrations/20260125_multi_tenant_foundation.sql` - Database schema with RLS functions
- `src/lib/multi-tenant/tenant-context.ts` - Server-side tenant context management
- `src/lib/multi-tenant/middleware.ts` - API middleware for tenant validation
- `src/lib/multi-tenant/hooks.tsx` - React hooks and TenantProvider
- `src/lib/multi-tenant/index.ts` - Module exports
- `src/lib/modules/database/tenant-data-access.ts` - Tenant-isolated data access
- `src/lib/modules/database/agency-data-access.ts` - Agency-level admin access
- `src/lib/modules/database/cross-module-access.ts` - Cross-module data access with permissions
- `src/lib/modules/database/tenant-data-export.ts` - Data export/import functionality
- Updated `src/lib/modules/database/index.ts` - Added new exports

**Key Features:**
1. **Tenant Context** - `getTenantContext()`, `getFullTenantContext()`, `setDatabaseContext()`
2. **RLS Functions** - `set_tenant_context()`, `current_agency_id()`, `current_site_id()`, `user_has_site_access()`
3. **Module Data Access** - CRUD with automatic tenant filtering, pagination, soft delete
4. **Agency Admin Access** - Cross-site queries, stats, aggregations for admins
5. **Cross-Module Access** - Controlled data sharing with permission registry and audit logging
6. **Data Export/Import** - Full export with metadata, import with merge strategies
7. **Site Cloning** - Copy module data between sites in same agency
8. **React Hooks** - `useTenant()`, `useRequireSite()`, `useIsAdmin()`, `useTenantQuery()`

**Technical Notes:**
- Uses `AnySupabaseClient` type cast to handle dynamic table names not in Supabase types
- All module tables use `mod_<prefix>_<tablename>` naming pattern
- RLS policies auto-created via `create_module_table()` function
- Cross-module permissions defined in code, extendable via database

### Previously Completed: EM-33 API-Only Mode ✅ DEPLOYED
**Completed**: January 23, 2026

**What was built:**
- Custom domain mapping to modules
- DNS verification (CNAME and TXT methods)
- SSL certificate provisioning (placeholder for Let's Encrypt)
- White-label branding (logo, favicon, colors, custom CSS)
- Edge router with caching
- Domain analytics and request logging

**Files Created:**
- `migrations/em-32-custom-domains.sql` - Database schema with 4 new tables
- `src/lib/modules/domains/custom-domain-service.ts` - Domain management service
- `src/lib/modules/domains/edge-router.ts` - Request routing and white-label injection
- `src/lib/modules/domains/middleware.ts` - Next.js middleware integration
- `src/lib/modules/domains/index.ts` - Module exports
- `src/components/modules/domains/DomainSettings.tsx` - UI component
- `src/app/api/modules/[moduleId]/domains/` - API routes for CRUD operations
- `scripts/check-schema.ts` - Database schema verification utility

**Schema Fix Applied:**
- Initial migration referenced `site_modules` table (doesn't exist)
- Verified actual DB has `site_module_installations` table
- Updated all references: migration SQL, TypeScript services, API routes, edge router, middleware
- Migration now runs successfully ✅

**Key Features:**
1. **Domain Management** - Add, verify, delete custom domains
2. **DNS Verification** - CNAME or TXT record verification
3. **SSL Certificates** - Auto-provision (needs production implementation)
4. **White-Label** - Custom branding per domain
5. **Edge Routing** - Cache-first routing with headers
6. **Analytics** - Request logging and bandwidth tracking

### Previous: Wave 1 Infrastructure + Wave 3 Distribution
**Completed**: January 23, 2026  

**What was built:**
- Domain allowlist & verification system
- CDN-hosted embed SDK for external websites
- OAuth 2.0 service for external API access
- CORS middleware for cross-origin requests
- Webhook service for event notifications
- External API request logging and rate limiting

## Next Steps

### Current Status Summary
**17 of 34 phases complete (50%)**
- ✅ Wave 1: Foundation (6/6) - 100% COMPLETE
- ✅ Wave 2: Developer Tools (4/4) - 100% COMPLETE
- ✅ Wave 3: Distribution (6/6) - 100% COMPLETE
- 🔄 Wave 4: Enterprise (1/4) - EM-40 Complete
- ⬜ Wave 5: Business Modules (0/7) - **READY TO BUILD**
- ⬜ Wave 6: Industry Verticals (0/6)

### Immediate Priority: Build Business Modules (Wave 5)
All infrastructure is complete! Time to build revenue-generating modules:

1. 🎯 **EM-50: CRM Module** - RECOMMENDED FIRST (~10 hours)
2. 🎯 **EM-51: Booking Module** - High Demand (~8 hours)
3. 🎯 **EM-55: Accounting Module** - Invoicing (~8 hours)

## Recent Decisions

### Technical Decisions (EM-32)
1. **Service Client Pattern** - Use separate service client to bypass strict Supabase types
2. **In-memory Cache** - Domain routing uses Map cache with 1-minute TTL
3. **Mock SSL in Dev** - SSL provisioning returns mock cert in development
4. **Vercel SSL** - Default to Vercel-managed SSL in production

### Architecture Decisions
1. **Separate Domain Service** - `src/lib/modules/domains/` for custom domain code
2. **Edge Router Pattern** - Centralized routing and white-label injection
3. **Middleware Integration** - Can hook into main middleware for routing
4. **CSS Variable Injection** - Brand colors via CSS custom properties

## Active Patterns & Preferences

### Code Organization (EM-32)
- Domain services in `src/lib/modules/domains/`
- API routes in `src/app/api/modules/[moduleId]/domains/`
- UI components in `src/components/modules/domains/`
- Use TypeScript interfaces for all services
- Export services from `index.ts`

### Security Practices
- Encrypt SSL private keys (AES-256-GCM)
- Verify domain ownership before issuing SSL
- RLS policies on all domain tables
- Admin access required for domain management

### Database Patterns
- Use UUIDs for all IDs
- Enable RLS on all tables
- Add `created_at` and `updated_at` timestamps
- Use foreign key constraints with CASCADE
- Index frequently queried columns
- Use Postgres functions for domain lookup
- **Verify actual DB schema** before writing migrations (use `scripts/check-schema.ts`)
- Current module table: `site_module_installations` (not `site_modules`)

## Important Files & Locations

### Custom Domains (EM-32)
- **Service**: `src/lib/modules/domains/custom-domain-service.ts`
- **Router**: `src/lib/modules/domains/edge-router.ts`
- **Middleware**: `src/lib/modules/domains/middleware.ts`
- **UI**: `src/components/modules/domains/DomainSettings.tsx`

### API Routes (EM-32)
- **List/Add**: `/api/modules/[moduleId]/domains`
- **Get/Delete**: `/api/modules/[moduleId]/domains/[domainId]`
- **Verify**: `/api/modules/[moduleId]/domains/[domainId]/verify`
- **Settings**: `/api/modules/[moduleId]/domains/[domainId]/settings`

### Database (EM-32)
- **Migration**: `migrations/em-32-custom-domains.sql` ✅ Successfully migrated
- **Tables**: `module_custom_domains`, `domain_dns_records`, `domain_ssl_certificates`, `domain_request_logs`
- **Functions**: `get_module_by_domain()`, `increment_domain_stats()`, `get_domains_for_ssl_renewal()`
- **FK Reference**: Uses `site_module_installations` table (verified against production DB)

### External Integration (EM-31)
- **Domain Service**: `src/lib/modules/external/domain-service.ts`
- **OAuth Service**: `src/lib/modules/external/oauth-service.ts`
- **Webhook Service**: `src/lib/modules/external/webhook-service.ts`
- **CORS Middleware**: `src/lib/modules/external/cors-middleware.ts`
- **Embed SDK**: `src/lib/modules/external/embed-sdk.ts`

### Documentation
- **Phase Doc**: `phases/enterprise-modules/PHASE-EM-32-CUSTOM-DOMAINS.md`
- **Implementation Order**: `phases/enterprise-modules/IMPLEMENTATION-ORDER.md`
- **Platform Docs**: `docs/` (architecture, status, implementation summary)
- **Dashboard Docs**: `next-platform-dashboard/docs/`

## Current Blockers

**None currently** - EM-32 is complete and functional.

## Production Readiness Notes

### For Custom Domains (EM-32)
1. **SSL Provider** - Need actual Let's Encrypt/ACME or Cloudflare integration
2. **SSL Encryption Key** - Generate and set `SSL_ENCRYPTION_KEY` env var
3. **Domain Verification** - DNS lookups work but need production DNS server
4. **Cron Job** - Need job to call `CustomDomainService.checkAndRenewCertificates()`
5. **Middleware Integration** - Hook `handleCustomDomain` into main middleware

### General
1. **Rate Limiting** - Currently using in-memory cache, should use Redis
2. **Background Jobs** - Need proper queue system for SSL renewals
3. **Error Monitoring** - Add Sentry for production error tracking

## Notes for Future Sessions

### When Working on Business Modules
- All infrastructure (EM-01 to EM-32) is complete
- Can leverage domain system for white-label module hosting
- OAuth and webhooks ready for third-party integrations
- Analytics foundation ready for module-specific metrics
