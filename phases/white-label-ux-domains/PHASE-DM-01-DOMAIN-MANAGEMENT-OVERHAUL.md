# PHASE-DM-01: Domain Management Overhaul — Cascading Updates & Industry-Grade DNS

**Priority**: 🔴 P0 (Critical Infrastructure)  
**Estimated Effort**: 3-4 days  
**Dependencies**: None (can run parallel with WL-01)  
**Goal**: When a domain changes, EVERYTHING updates automatically — sitemaps, canonical URLs, OG tags, form redirects, SSL, DNS — zero manual intervention

---

## Context

### Current Problems
1. **BASE_DOMAIN inconsistency**: `sites.dramacagency.com` in some files, `dramac.app` in others — 6+ different references
2. **Domains Manager is a STUB**: The `domains-manager.tsx` component uses `useState` with empty arrays and `setTimeout` mocks — it does nothing real
3. **No cascade on domain change**: When a domain changes, sitemaps still reference old domain, canonical URLs go stale, OG meta tags point to dead URLs, form redirect URLs break
4. **No Vercel domain API integration**: Custom domains won't get SSL without Vercel API calls
5. **No 301 redirects**: Old domain → new domain redirects don't exist
6. **DNS verification is manual**: No auto-polling to confirm DNS propagation
7. **No domain health monitoring**: No way to detect if a domain's DNS breaks after initial setup
8. **Two separate domain systems**: Site-level domains and module-level domains are disconnected

---

## Task 1: Unify BASE_DOMAIN Configuration

**Problem**: 6+ files reference different base domains, making domain logic fragile.  
**Solution**: Single source of truth for all domain constants.

### Implementation

1. Create `src/lib/constants/domains.ts`:

```typescript
// Single source of truth for all domain constants
export const DOMAINS = {
  // Platform base domain (for subdomains like agency-slug.dramac.app)
  PLATFORM_BASE: process.env.NEXT_PUBLIC_PLATFORM_DOMAIN ?? 'dramac.app',
  
  // Sites base domain (for site subdomains like my-site.sites.dramac.app)
  SITES_BASE: process.env.NEXT_PUBLIC_SITES_DOMAIN ?? 'sites.dramac.app',
  
  // App domain (dashboard, API, auth)
  APP_DOMAIN: process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.dramacagency.com',
  
  // Default protocol
  PROTOCOL: process.env.NODE_ENV === 'production' ? 'https' : 'http',
} as const;

// Helper: Get the full URL for a site
export function getSiteUrl(site: { custom_domain?: string | null; subdomain: string }): string {
  if (site.custom_domain) {
    return `${DOMAINS.PROTOCOL}://${site.custom_domain}`;
  }
  return `${DOMAINS.PROTOCOL}://${site.subdomain}.${DOMAINS.SITES_BASE}`;
}

// Helper: Get the canonical URL for a page
export function getCanonicalUrl(site: { custom_domain?: string | null; subdomain: string }, path: string = '/'): string {
  return `${getSiteUrl(site)}${path}`;
}
```

2. Find and replace ALL hardcoded domain references:

| File | Current | Replace With |
|------|---------|-------------|
| `src/lib/published-site/` | `sites.dramacagency.com` | `DOMAINS.SITES_BASE` |
| `src/middleware.ts` | Hardcoded domain checks | `DOMAINS.SITES_BASE` |
| `src/lib/seo/` | Various domain strings | `getSiteUrl()` |
| `src/lib/actions/domains.ts` | Mixed references | `DOMAINS.SITES_BASE` |
| `src/app/api/sites/` | Hardcoded domains | `DOMAINS` constants |
| `next.config.ts` | Domain patterns | `DOMAINS.SITES_BASE` |

### Acceptance Criteria
- [ ] `grep -r "sites.dramacagency.com\|dramac\.app" src/ --include="*.ts" --include="*.tsx"` returns only the constants file
- [ ] All domain logic uses `DOMAINS` constants or helpers
- [ ] Changing `NEXT_PUBLIC_SITES_DOMAIN` env var propagates everywhere

---

## Task 2: Domain Change Cascade Service

**Problem**: Changing a domain doesn't update dependent resources.  
**Solution**: Build a cascade service that updates everything when a domain changes.

### What Must Update When a Domain Changes

| Resource | What Changes | Impact if Stale |
|----------|-------------|----------------|
| Sitemap | All `<loc>` URLs | Search engines crawl wrong domain |
| robots.txt | `Sitemap:` URL | Search engines can't find sitemap |
| Canonical URLs | `<link rel="canonical">` | SEO penalties for duplicate content |
| OG Meta Tags | `og:url`, `og:image` | Social shares show wrong domain |
| Structured Data (JSON-LD) | `@id`, `url` fields | Rich results break |
| Form redirects | Thank-you page URLs | Users redirected to dead page |
| Email links | All URLs in emails | Clicked links in sent emails break |
| Embed widget URLs | Script `src` | Embedded widgets break |
| SSL Certificate | Vercel domain binding | HTTPS stops working |
| DNS Records | CNAME/A records | Domain won't resolve |
| Internal references | `site.custom_domain` | Wrong domain shown in dashboard |
| Webhook URLs | Callback URLs | Integrations break |
| 301 Redirects | Old → new domain mapping | Old bookmarks/links break |

### Implementation

Create `src/lib/services/domain-cascade.ts`:

```typescript
export interface DomainChangeEvent {
  siteId: string;
  previousDomain: string | null; // null if first-time setup
  newDomain: string;
  changeType: 'custom_domain_added' | 'custom_domain_changed' | 'custom_domain_removed' | 'subdomain_changed';
}

export async function handleDomainChange(event: DomainChangeEvent): Promise<DomainCascadeResult> {
  const results: CascadeStepResult[] = [];
  
  // 1. Update site record
  results.push(await updateSiteRecord(event));
  
  // 2. Update/regenerate sitemap
  results.push(await regenerateSitemap(event.siteId));
  
  // 3. Update robots.txt
  results.push(await regenerateRobotsTxt(event.siteId));
  
  // 4. Invalidate OG/meta cache
  results.push(await invalidateMetaCache(event.siteId));
  
  // 5. Update canonical URLs in all published pages
  results.push(await updateCanonicalUrls(event.siteId));
  
  // 6. Setup Vercel domain (add new, remove old)
  if (event.newDomain !== event.previousDomain) {
    results.push(await configureVercelDomain(event));
  }
  
  // 7. Create 301 redirect from old domain
  if (event.previousDomain) {
    results.push(await create301Redirect(event.previousDomain, event.newDomain));
  }
  
  // 8. Update form redirect URLs
  results.push(await updateFormRedirects(event.siteId, event.previousDomain, event.newDomain));
  
  // 9. Update structured data
  results.push(await updateStructuredData(event.siteId));
  
  // 10. Notify site owner
  results.push(await notifySiteOwner(event));
  
  return {
    success: results.every(r => r.success),
    steps: results,
  };
}
```

### Individual Cascade Functions

**Sitemap Regeneration:**
```typescript
async function regenerateSitemap(siteId: string) {
  // Fetch all published pages for the site
  // Build sitemap XML with correct domain from getSiteUrl()
  // Write to storage/CDN
  // Ping Google: GET https://www.google.com/ping?sitemap={url}
}
```

**Vercel Domain API:**
```typescript
async function configureVercelDomain(event: DomainChangeEvent) {
  const vercelToken = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  
  // Remove old domain
  if (event.previousDomain) {
    await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains/${event.previousDomain}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${vercelToken}` },
    });
  }
  
  // Add new domain
  await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: event.newDomain }),
  });
  
  // SSL is automatic on Vercel after domain is added
}
```

**301 Redirect System:**
```typescript
async function create301Redirect(oldDomain: string, newDomain: string) {
  // Store in database
  await supabase.from('domain_redirects').insert({
    from_domain: oldDomain,
    to_domain: newDomain,
    redirect_type: '301',
    active: true,
    created_at: new Date().toISOString(),
  });
}
```

### Acceptance Criteria
- [ ] Changing a domain triggers the full cascade automatically
- [ ] Sitemap regenerated with correct URLs
- [ ] robots.txt updated with correct sitemap URL
- [ ] Canonical URLs updated across all published pages
- [ ] OG meta tags reference the new domain
- [ ] Vercel domain API called (add new, remove old)
- [ ] 301 redirect created from old → new domain
- [ ] Form redirect URLs updated
- [ ] Site owner receives notification of domain change

---

## Task 3: Replace Domains Manager Stub with Real Implementation

**Problem**: `domains-manager.tsx` is a non-functional stub using `useState([])` and `setTimeout` mocks.  
**Solution**: Build a production-ready domain management component.

### Implementation

Rebuild `src/components/domains/domains-manager.tsx`:

**Section 1: Current Domain Status**
```
┌─────────────────────────────────────────────────────┐
│ 🌐 Domain Configuration                             │
│                                                      │
│ Current Domain: my-site.sites.dramac.app     [Copy] │
│ Custom Domain:  www.mybusiness.com            ✅ SSL │
│                                                      │
│ Status: Active · SSL Valid · DNS Verified            │
└─────────────────────────────────────────────────────┘
```

**Section 2: Add/Change Custom Domain**
- Text input for domain name
- Real-time format validation (no http://, valid TLD, etc.)
- DNS instructions:
  - CNAME record: `www` → `cname.vercel-dns.com`
  - A record: `@` → `76.76.21.21` (Vercel)
- "Verify DNS" button that checks in real-time
- Auto-polling: Check DNS every 30 seconds after setup (up to 10 minutes)
- Show step-by-step progress:
  1. ⏳ Domain entered
  2. ⏳ DNS records configured
  3. ⏳ DNS propagation verified
  4. ⏳ SSL certificate provisioned
  5. ✅ Domain active

**Section 3: Domain History**
- List of previous domains with dates
- Active redirects (301s from old domains)
- Option to disable/remove old redirects

### API Routes

Create `src/app/api/domains/`:
- `POST /api/domains/verify` — Check DNS records for a domain
- `POST /api/domains/add` — Add custom domain (triggers cascade)
- `DELETE /api/domains/[domain]` — Remove custom domain
- `GET /api/domains/[domain]/status` — Get SSL/DNS status
- `GET /api/domains/health` — Health check for all domains

### DNS Verification Logic

```typescript
import { resolve } from 'dns/promises';

export async function verifyDnsRecords(domain: string): Promise<DnsVerification> {
  const results = {
    cname: false,
    a: false,
    aaaa: false,
    propagated: false,
  };
  
  try {
    // Check CNAME
    const cnames = await resolve(domain, 'CNAME');
    results.cname = cnames.some(r => r.includes('vercel'));
    
    // Check A record
    const aRecords = await resolve(domain, 'A');
    results.a = aRecords.includes('76.76.21.21');
    
    results.propagated = results.cname || results.a;
  } catch (err) {
    // DNS not yet propagated
  }
  
  return results;
}
```

### Acceptance Criteria
- [ ] Domain manager shows current domain status (subdomain + custom domain)
- [ ] Can add a custom domain with clear DNS instructions
- [ ] DNS verification works (checks CNAME/A records)
- [ ] Auto-polling detects when DNS propagates
- [ ] SSL status shown (from Vercel API)
- [ ] Domain changes trigger the cascade service (Task 2)
- [ ] Domain history shows previous domains and active redirects
- [ ] Error states handled: invalid domain, DNS timeout, Vercel API failure

---

## Task 4: Domain Health Monitoring

**Problem**: No way to detect if a domain's DNS breaks after initial setup (e.g., customer changes DNS provider).  
**Solution**: Periodic domain health checks with alerting.

### Implementation

1. Create `src/lib/services/domain-health.ts`:

```typescript
export async function checkDomainHealth(siteId: string): Promise<DomainHealthReport> {
  const site = await getSite(siteId);
  if (!site.custom_domain) return { healthy: true, checks: [] };
  
  const checks: HealthCheck[] = [];
  
  // 1. DNS Resolution
  checks.push(await checkDnsResolution(site.custom_domain));
  
  // 2. HTTP Reachability (does it load?)
  checks.push(await checkHttpReachability(site.custom_domain));
  
  // 3. SSL Certificate Validity
  checks.push(await checkSslCertificate(site.custom_domain));
  
  // 4. Redirect chain (no infinite loops)
  checks.push(await checkRedirectChain(site.custom_domain));
  
  return {
    healthy: checks.every(c => c.passed),
    checks,
    lastChecked: new Date().toISOString(),
  };
}
```

2. Create a Cron Job or Vercel Cron:
   - `src/app/api/cron/domain-health/route.ts`
   - Runs every 6 hours
   - Checks all sites with custom domains
   - Sends alert email if any domain becomes unhealthy
   - Dashboard notification for unhealthy domains

3. Show domain health in site settings:
   ```
   Domain Health: ✅ Healthy
   Last checked: 2 hours ago
   
   ✅ DNS resolves correctly
   ✅ HTTPS loads (247ms)
   ✅ SSL valid (expires in 68 days)
   ✅ No redirect loops
   ```

### Acceptance Criteria
- [ ] Health check runs for all custom domains every 6 hours
- [ ] Unhealthy domain triggers email alert to site owner
- [ ] Dashboard shows domain health status
- [ ] Health details available: DNS, HTTP, SSL, redirects
- [ ] No false positives (retry logic for transient failures)

---

## Task 5: Middleware Domain Routing Fix

**Problem**: Middleware domain matching is fragile with hardcoded strings.  
**Solution**: Use the unified DOMAINS config and handle edge cases.

### Implementation

1. Update `src/middleware.ts`:
```typescript
import { DOMAINS } from '@/lib/constants/domains';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // 1. Skip non-site domains (app, API, auth)
  if (hostname === new URL(DOMAINS.APP_DOMAIN).hostname) {
    return handleDashboardRoute(request);
  }
  
  // 2. Check for custom domain
  const site = await lookupSiteByDomain(hostname);
  if (site) {
    return rewriteToSiteRoute(request, site);
  }
  
  // 3. Check for subdomain
  if (hostname.endsWith(`.${DOMAINS.SITES_BASE}`)) {
    const subdomain = hostname.replace(`.${DOMAINS.SITES_BASE}`, '');
    const site = await lookupSiteBySubdomain(subdomain);
    if (site) {
      return rewriteToSiteRoute(request, site);
    }
  }
  
  // 4. Check for 301 redirect
  const redirect = await lookupDomainRedirect(hostname);
  if (redirect) {
    return NextResponse.redirect(
      `${DOMAINS.PROTOCOL}://${redirect.to_domain}${request.nextUrl.pathname}`,
      { status: 301 }
    );
  }
  
  // 5. Unknown domain
  return new NextResponse('Domain not configured', { status: 404 });
}
```

2. Add redirect lookup for 301s from old domains
3. Handle www vs non-www consistently (redirect one to the other)
4. Handle trailing slashes consistently

### Acceptance Criteria
- [ ] Custom domain routes to correct site
- [ ] Subdomain routes to correct site
- [ ] Old domain 301 redirects to new domain
- [ ] www ↔ non-www handled consistently
- [ ] Unknown domains show 404 (not a crash)

---

## Task 6: Domain Redirects Database & Management

**Problem**: No system for managing 301 redirects when domains change.  
**Solution**: Database table + management UI.

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS public.domain_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  from_domain TEXT NOT NULL,
  to_domain TEXT NOT NULL,
  redirect_type TEXT DEFAULT '301' CHECK (redirect_type IN ('301', '302')),
  preserve_path BOOLEAN DEFAULT true,  -- /page → newdomain.com/page
  active BOOLEAN DEFAULT true,
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(from_domain)
);
```

### Management UI

In site settings → Domains section:
- List of active redirects
- Toggle active/inactive
- Hit counter (how many times the redirect was used)
- Delete redirect option
- Add manual redirect (for domains acquired outside the platform)

### Acceptance Criteria
- [ ] Redirects created automatically on domain change
- [ ] Redirects work in middleware (301 with path preservation)
- [ ] Admin can view, toggle, and delete redirects
- [ ] Hit counter tracks redirect usage
- [ ] Can add manual redirects

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `src/lib/constants/domains.ts` | Unified domain configuration |
| CREATE | `src/lib/services/domain-cascade.ts` | Domain change cascade |
| CREATE | `src/lib/services/domain-health.ts` | Health monitoring |
| CREATE | `src/app/api/domains/verify/route.ts` | DNS verification |
| CREATE | `src/app/api/domains/add/route.ts` | Add custom domain |
| CREATE | `src/app/api/domains/[domain]/status/route.ts` | Domain status |
| CREATE | `src/app/api/cron/domain-health/route.ts` | Health check cron |
| CREATE | `migrations/XXXX_domain_redirects.sql` | Redirects table |
| REBUILD | `src/components/domains/domains-manager.tsx` | Real domain management |
| MODIFY | `src/middleware.ts` | Unified domain routing |
| MODIFY | All files with hardcoded domains | Use `DOMAINS` constants |
| MODIFY | `src/lib/seo/` files | Use `getCanonicalUrl()` |
| MODIFY | `src/lib/published-site/` files | Use `getSiteUrl()` |

---

## Testing Checklist

- [ ] Add custom domain to a site → DNS instructions shown
- [ ] Click "Verify DNS" → correctly detects CNAME/A records
- [ ] After DNS verified → SSL provisioned (check Vercel)
- [ ] Visit custom domain → correct site loads
- [ ] Change domain → old domain 301 redirects to new domain
- [ ] After domain change: check sitemap → all URLs use new domain
- [ ] After domain change: check `<link rel="canonical">` → new domain
- [ ] After domain change: check OG tags → new domain
- [ ] After domain change: check robots.txt → correct sitemap URL
- [ ] Domain health check runs → catches broken DNS
- [ ] Unhealthy domain → email alert sent to site owner
- [ ] Remove custom domain → site reverts to subdomain cleanly
- [ ] Middleware: unknown domain → 404 (no crash)
- [ ] `grep -r "sites.dramacagency.com" src/` → only in constants file
