# Active Context: Current Work & Focus

**Last Updated**: January 26, 2026  
**Current Phase**: EM-59B Paddle Billing Integration - UI, Portal & Operations ✅ COMPLETE  
**Status**: ✅ 21 OF 34 PHASES (62%) - TypeScript Verified

## Current Work Focus

### ✅ COMPLETED: EM-59B Paddle Billing Integration - Final Fixes (January 26, 2026)
**Status**: ✅ COMPLETE - All issues fixed and tested  
**Wave 5 Business**: 2/3 BILLING COMPLETE (66%)  
**TypeScript Compilation**: ✅ Zero errors

**Critical Bug Fixes Applied (January 26, 2026):**

1. **Signup RLS Policy Fix** - Changed from regular Supabase client to admin client for signup:
   - Root cause: After `supabase.auth.signUp()`, user session isn't immediately available
   - RLS policy `owner_id = auth.uid()` was failing because auth.uid() returned null
   - Fix: Use `createAdminClient()` (service role) for agency, profile, and agency_member creation
   - Added proper cleanup on failure (deletes created records if subsequent steps fail)

2. **Pricing Page Authentication State** - Fixed pricing page to properly handle logged-in users:
   - Added `useEffect` to check auth state on mount
   - Fetch user's email and agencyId from profile
   - Pass `agencyId` and `email` props to PricingCard components
   - When logged in: Opens Paddle checkout directly
   - When not logged in: Redirects to `/signup?plan=<planId>`

3. **Environment Variables** - Added `NEXT_PUBLIC_` prefix to price IDs:
   - `NEXT_PUBLIC_PADDLE_PRICE_STARTER_MONTHLY`
   - `NEXT_PUBLIC_PADDLE_PRICE_STARTER_YEARLY`
   - `NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY`
   - `NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY`
   - Required for client-side pricing page to access price IDs

4. **Public Route Access** - Previously fixed in proxy.ts:
   - Added `/pricing` to public routes list
   - Pricing page now accessible without login

**Files Modified:**
- `src/lib/actions/auth.ts` - Use admin client for signup database operations
- `src/app/pricing/page.tsx` - Check auth state, pass user data to pricing cards
- `.env.local` - Added NEXT_PUBLIC_ prefix to price IDs
- `docs/PADDLE-TESTING-GUIDE.md` - Updated env variable names
- `src/proxy.ts` - Added /pricing to public routes (done earlier)

---

### ✅ COMPLETED: EM-59B Paddle Billing Integration - UI, Portal & Operations (January 26, 2026)
**Status**: ✅ COMPLETE - All UI components, services, and API routes implemented  
**TypeScript Compilation**: ✅ Zero errors

**What was built:**

**UI Components:**
- `src/components/billing/pricing-card.tsx` - Pricing plan display with checkout integration
- `src/components/billing/billing-cycle-toggle.tsx` - Monthly/yearly toggle with savings badge
- `src/components/billing/usage-dashboard.tsx` - Usage metrics visualization with projections
- `src/components/billing/paddle-invoice-history.tsx` - Invoice list with download links
- `src/components/billing/paddle-subscription-card.tsx` - Subscription management UI
- `src/components/admin/billing-overview.tsx` - Admin billing metrics dashboard

**Pages:**
- `src/app/pricing/page.tsx` - Public pricing page with FAQ
- `src/app/(dashboard)/admin/billing/page.tsx` - Admin billing dashboard

**Services:**
- `src/lib/paddle/dunning-service.ts` - Payment failure handling, retry emails, account suspension
- `src/lib/paddle/enterprise-service.ts` - Enterprise quote generation, pricing calculation, acceptance

**API Routes (6 new):**
- `src/app/api/billing/paddle/subscription/cancel/route.ts` - Cancel subscription
- `src/app/api/billing/paddle/subscription/pause/route.ts` - Pause subscription
- `src/app/api/billing/paddle/subscription/resume/route.ts` - Resume subscription
- `src/app/api/billing/paddle/subscription/reactivate/route.ts` - Reactivate canceled subscription
- `src/app/api/billing/paddle/subscription/update-payment/route.ts` - Update payment method
- `src/app/api/admin/billing/overview/route.ts` - Admin billing metrics

**Extended subscription-service.ts with:**
- `reactivateSubscription()` - Reactivate canceled/paused subscriptions
- `getUpdatePaymentUrl()` - Get Paddle payment update URL
- `getSubscriptionDetails()` - Get subscription with management URLs

**Test Utilities:**
- `src/lib/paddle/__tests__/test-utils.ts` - Sandbox test cards, webhook simulation, helpers

**Key Features:**
1. **Pricing UI** - Beautiful pricing cards with feature comparison, usage limits, yearly savings
2. **Subscription Management** - Cancel, pause, resume, upgrade/downgrade
3. **Usage Dashboard** - Real-time usage tracking, progress bars, overage projections
4. **Invoice History** - Download invoices, view payment history
5. **Dunning System** - Auto-retry failed payments, email notifications, account suspension
6. **Enterprise Quotes** - Custom pricing calculator, quote generation, acceptance flow
7. **Admin Dashboard** - MRR/ARR metrics, churn rate, top agencies by revenue

**Updated index.ts exports:**
- Added DunningService, dunningService singleton
- Added EnterpriseService, enterpriseService singleton
- All new types exported

---

### ✅ Previously: EM-59A Paddle Billing Integration (January 26, 2026)
**Status**: ✅ COMPLETE - All services, UI, and API routes implemented  
**Wave 5 Business**: 1/3 COMPLETE (33%)  
**TypeScript Compilation**: ✅ Zero errors

**Why Paddle?**
- Paddle supports Zambia payouts via Payoneer/Wise
- LemonSqueezy does NOT support Zambia
- Payment flow: Paddle → Payoneer/Wise → Zambia Bank Account

**What was built:**
- Paddle Node.js SDK integration with server-side client
- Paddle.js frontend integration for checkout flows
- Subscription lifecycle management (create, update, pause, resume, cancel)
- Usage-based billing with overage tracking (automation runs, AI actions, API calls)
- Webhook handlers for all Paddle event types
- Customer management with Paddle sync
- Invoice/transaction history
- Billing actions (server-side mutations)
- Automation event integration (22 new billing events)

**Files Created:**
- `migrations/em-59a-paddle-billing.sql` - Complete database schema for Paddle
- `src/lib/paddle/client.ts` - Paddle SDK initialization and configuration
- `src/lib/paddle/paddle-client.ts` - Frontend Paddle.js integration
- `src/lib/paddle/subscription-service.ts` - Subscription lifecycle management
- `src/lib/paddle/usage-tracker.ts` - Usage tracking and overage calculations
- `src/lib/paddle/webhook-handlers.ts` - Process all Paddle webhook events
- `src/lib/paddle/billing-actions.ts` - Server actions for billing operations
- `src/lib/paddle/index.ts` - Module exports
- `src/app/api/webhooks/paddle/route.ts` - Webhook endpoint
- `src/app/api/billing/paddle/route.ts` - Billing status API
- `src/app/api/billing/paddle/subscription/route.ts` - Subscription management API
- `src/app/api/billing/paddle/usage/route.ts` - Usage tracking API
- `src/app/api/billing/paddle/invoices/route.ts` - Invoice history API
- `docs/PADDLE-BILLING-SETUP.md` - Comprehensive setup documentation

**Pricing Model:**
- Starter: $29/month - 1,000 automation runs, 500 AI actions, 10,000 API calls
- Pro: $99/month - 5,000 automation runs, 2,500 AI actions, 50,000 API calls
- Overages: $0.01/automation run, $0.02/AI action, $0.001/API call

**Key Features:**
1. **PaddleClient** - Server SDK with environment detection, customer/subscription/price management
2. **PaddleJsClient** - Frontend checkout, overlay integration, event handling
3. **SubscriptionService** - Full lifecycle with status updates, plan changes, cancellation
4. **UsageTracker** - Real-time usage recording, overage detection, alerts at 80%/100%
5. **WebhookHandlers** - 15+ event types processed with idempotency
6. **BillingActions** - Server-side mutations for all billing operations
7. **Automation Events** - 22 billing events integrated into automation engine

**Database Tables Created:**
- `paddle_customers` - Customer sync with Paddle
- `paddle_subscriptions` - Subscription state and limits
- `paddle_transactions` - Payment history
- `paddle_products` - Product catalog sync
- `paddle_webhooks` - Webhook logging and replay
- `usage_hourly` - Hourly usage aggregation
- `usage_daily` - Daily usage totals
- `usage_billing_period` - Period summary for billing

**Automation Events Added (22 new events):**
- subscription.created, activated, updated, cancelled, paused, resumed
- subscription.past_due, trial_started, trial_ended, plan_changed
- payment.completed, failed, refunded, disputed
- invoice.created, paid, overdue
- usage.threshold_reached, limit_exceeded, overage_incurred
- customer.created, updated

---

### ✅ Previously: EM-41 Module Versioning & Rollback (January 23, 2026)
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
