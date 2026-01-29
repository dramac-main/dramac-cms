# System Patterns: DRAMAC Architecture

**Last Updated**: January 26, 2026

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js Server Actions, API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS policies
- **Billing**: Paddle (Phase EM-59) - Zambia-compatible via Payoneer/Wise
- **Hosting**: Vercel (platform), Supabase (data)
- **UI**: Radix UI, Tailwind CSS, Framer Motion
- **State**: Zustand, TanStack Query
- **Editor**: Monaco Editor, Craft.js (page builder), TipTap (rich text)

### Project Structure

```
dramac-cms/
├── docs/                      # Platform documentation
│   ├── README.md             # Documentation index
│   ├── PLATFORM-ANALYSIS.md  # Architecture overview
│   └── IMPLEMENTATION-COMPLETE.md
├── memory-bank/              # AI assistant context
├── phases/                   # Phase documentation
│   └── enterprise-modules/  # Current phase docs
├── packages/                 # Monorepo packages
│   ├── dramac-cli/          # CLI tools
│   ├── sdk/                 # Module SDK
│   ├── test-modules/        # Test modules
│   └── vscode-extension/    # VS Code extension
└── next-platform-dashboard/
    ├── src/
    │   ├── app/                    # Next.js 15 app router
    │   │   ├── (auth)/            # Auth pages
    │   │   ├── (dashboard)/       # Main dashboard
    │   │   ├── (client-portal)/   # Client-facing portal
    │   │   ├── (public)/          # Public pages (sites)
    │   │   └── api/               # API routes
    │   ├── components/            # React components
    │   ├── lib/                   # Utilities & services
    │   │   ├── supabase/         # DB clients
    │   │   ├── modules/          # Module system
    │   │   └── actions/          # Server actions
    │   ├── types/                # TypeScript definitions
    │   └── modules/              # Module implementations
    ├── docs/                     # Dashboard-specific docs
    ├── migrations/               # SQL migration files
    ├── public/                   # Static assets
    └── scripts/                  # Utility scripts
```

## Core Design Patterns

### 1. Multi-Tenant Hierarchy

```
Platform
  ├── Agency (Organization)
  │   ├── Sites (Client websites)
  │   │   ├── Pages
  │   │   ├── Assets
  │   │   └── Installed Modules
  │   ├── Team Members (roles)
  │   └── Billing (subscription)
  └── Users (authentication)
```

**Implementation**:
- Every data row has agency_id foreign key
- RLS policies enforce tenant isolation
- Row-level security on all tables
- Cascade deletes for data integrity

### 2. Module Architecture

**Module Marketplace Flow (IMPORTANT):**
```
modules_v2 (Marketplace catalog - registered by platform admin)
    ↓ 
    Browse at /marketplace/v2
    ↓
agency_module_subscriptions
    ↓ Agency subscribes via:
    │   - POST /api/modules/subscribe (free modules)
    │   - POST /api/modules/{moduleId}/purchase (paid modules)
    │   - Stores wholesale_price, markup settings
    ↓
site_module_installations
    ↓ Agency enables on specific sites via:
    │   - Site > Modules tab > Toggle ON
    │   - Creates installation record
    ↓
Module becomes accessible to site
```

**Module Access Control Pattern (January 29, 2026):**
```typescript
// Server-side check for module access
import { getSiteEnabledModules, isModuleEnabledForSite } from '@/lib/actions/sites'

// In site detail page - conditional UI
const enabledModules = await getSiteEnabledModules(siteId)
const hasSocial = enabledModules.has('social-media')
{hasSocial && <TabsTrigger value="social">Social</TabsTrigger>}

// In module route pages - access guard
const hasAccess = await isModuleEnabledForSite(siteId, 'social-media')
if (!hasAccess) redirect(`/dashboard/sites/${siteId}?tab=modules`)
```

**Key Files:**
- `src/lib/actions/sites.ts` - `getSiteEnabledModules()`, `isModuleEnabledForSite()`
- `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx` - Conditional tabs/buttons
- Module routes - Access guards redirect to modules tab if not enabled

**Module Lifecycle:**
```
Create → Build → Test → Deploy → Publish → Install → Render
```

**Module Types:**
1. **Widget** - Simple component (no database)
2. **App** - Multi-page application (with database)
3. **Integration** - Third-party API connector
4. **System** - Enterprise application
5. **Custom** - Client-specific solution

**Module Structure:**
```typescript
{
  id: uuid,
  name: string,
  type: ModuleType,
  source: 'official' | 'studio' | 'marketplace',
  code: {
    component: string,     // React component code
    styles: string,        // CSS/Tailwind
    schema: object,        // Config schema
    api: string[]          // API endpoints
  },
  manifest: {
    version: string,
    dependencies: string[],
    permissions: string[]
  }
}
```

### 3. Database-Per-Module Pattern

**Schema Isolation:**
- Each module gets own schema: `mod_<module_short_id>`
- Example: `mod_crm`, `mod_booking`, `mod_ecommerce`
- Tables within schema: `${schema}.contacts`, `${schema}.deals`
- RLS policies apply per-schema

**Benefits:**
- Data isolation between modules
- Independent migrations
- Easier cleanup on uninstall
- Namespace collision prevention

**Implementation:**
```sql
-- Create schema for module
CREATE SCHEMA IF NOT EXISTS mod_crm;

-- Create tables in schema
CREATE TABLE mod_crm.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  -- ... other fields
);

-- RLS policies
ALTER TABLE mod_crm.contacts ENABLE ROW LEVEL SECURITY;
```

### 4. API Patterns

**Server Actions (Preferred):**
```typescript
// src/lib/actions/modules.ts
"use server"

export async function installModule(moduleId: string, siteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_modules')
    .insert({ module_id: moduleId, site_id: siteId });
  
  revalidatePath('/dashboard/modules');
  return { data, error };
}
```

**API Routes (For Webhooks/External):**
```typescript
// src/app/api/modules/[id]/webhook/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  // Process webhook
  return Response.json({ success: true });
}
```

### 4B. Server→Client Component Wrapper Pattern (NEW)

**Problem:**
Next.js Server Components cannot pass function handlers to Client Components. This error occurs:
```
Error: Event handlers cannot be passed to Client Component props.
  <SomeComponent onSubmit={function} ...>
```

**Solution: Client Wrapper Pattern**
Create a client wrapper component that:
1. Accepts data props from Server Component
2. Handles navigation and actions internally using hooks
3. Calls server actions directly (not via props)

**Implementation:**
```typescript
// ❌ WRONG: Server page passing handlers
// src/app/(dashboard)/page.tsx
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent 
    data={data}
    onSubmit={handleSubmit} // Error! Can't pass functions
  />
}

// ✅ CORRECT: Use client wrapper
// src/components/ClientComponentWrapper.tsx
'use client'
import { useRouter } from 'next/navigation'
import { serverAction } from '@/actions/someAction'

export function ClientComponentWrapper({ data, siteId, userId }) {
  const router = useRouter()
  
  const handleSubmit = async (values) => {
    const result = await serverAction(siteId, userId, values) // Call server action
    if (!result.error) router.refresh()
  }
  
  return <ClientComponent data={data} onSubmit={handleSubmit} />
}

// src/app/(dashboard)/page.tsx
export default async function Page() {
  const data = await fetchData()
  return <ClientComponentWrapper data={data} siteId={id} userId={userId} />
}
```

**Key Points:**
- Server Components: Fetch data, pass to wrappers (no functions!)
- Client Wrappers: Handle navigation (`useRouter`), call server actions
- Server Actions: Accept full parameters (IDs from wrapper props)

**Examples in Codebase:**
- `ContentCalendarWrapper.tsx` - Wraps ContentCalendar
- `PostComposerWrapper.tsx` - Wraps PostComposer
- `SocialDashboardWrapper.tsx` - Wraps SocialDashboard

### 5. Authentication & Authorization

**Authentication:**
- Supabase Auth (email/password, OAuth)
- Session stored in cookies
- Middleware refreshes sessions

**Routing Architecture (Multi-Tenant):**
The platform uses a two-tier routing system:

1. **Tier 1: Domain Router (`src/proxy.ts`)** - Executes FIRST
   - Detects subdomain requests (`*.sites.dramacagency.com`)
   - Detects custom domain requests (e.g., `example.com`)
   - Rewrites to `/site/[domain]` routes
   - Passes through public routes without auth
   - Only checks auth for app domain routes

2. **Tier 2: Auth Middleware (`src/lib/supabase/middleware.ts`)** - Executes SECOND
   - Only called for app domain requests
   - Checks session and redirects to login if needed
   - Handles onboarding flow

**⚠️ CRITICAL**: `middleware.ts` (root) must call `proxy()` from `src/proxy.ts`
```typescript
// middleware.ts - CORRECT
export async function middleware(request: NextRequest) {
  return await proxy(request);
}

// middleware.ts - WRONG (causes subdomain auth issues)
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

**Public Routes (No Auth Required):**
Routes that should be accessible without login (defined in `src/lib/supabase/middleware.ts`):
- `/login`, `/signup`, `/forgot-password`, `/reset-password` - Auth pages
- `/auth/callback` - OAuth callback
- `/embed` - Module embed routes
- `/site` - **PUBLIC CLIENT SITES** (`/site/[domain]/[...slug]`)
- `/blog` - **PUBLIC BLOG PAGES** (`/blog/[subdomain]/[slug]`)
- `/preview` - Page preview routes
- `/api/*` - API routes (handle their own auth)

**Authorization Levels:**
1. **Super Admin** - Platform management
2. **Agency Owner** - Full agency access
3. **Agency Admin** - Most operations
4. **Agency Member** - Limited access
5. **Client User** - Client portal only

**RLS Pattern:**
```sql
-- Example policy: Users see only their agency data
CREATE POLICY "Users access own agency modules"
ON site_modules
FOR SELECT
USING (
  site_id IN (
    SELECT id FROM sites 
    WHERE agency_id = auth.uid()::uuid
  )
);
```

### 6. Module Embedding System

**Three Embedding Modes:**

1. **Platform Native:**
```tsx
<ModuleRenderer moduleId="uuid" config={{...}} />
```

2. **External Embed (iframe):**
```html
<script src="https://dramac.app/embed/module.js"></script>
<div data-dramac-module="crm" data-config="..."></div>
```

3. **SDK Integration:**
```typescript
import { DramacSDK } from '@dramac/sdk';
const sdk = new DramacSDK({ apiKey: '...' });
await sdk.modules.render('crm', container);
```

### 7. State Management

**Client State (Zustand):**
```typescript
// Global UI state
const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'dark',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen }))
}));
```

**Server State (TanStack Query):**
```typescript
// Data fetching with caching
const { data: modules } = useQuery({
  queryKey: ['modules', agencyId],
  queryFn: () => fetchModules(agencyId)
});
```

### 8. Error Handling

**Standard Error Pattern:**
```typescript
type ActionResult<T> = {
  data?: T;
  error?: string;
  success: boolean;
}

export async function createModule(input: ModuleInput): Promise<ActionResult<Module>> {
  try {
    // Validation
    if (!input.name) {
      return { success: false, error: 'Name is required' };
    }
    
    // Operation
    const module = await db.modules.create(input);
    
    return { success: true, data: module };
  } catch (error) {
    console.error('Create module failed:', error);
    return { success: false, error: 'Failed to create module' };
  }
}
```

### 9. Module Naming Conventions (EM-05)

**Schema Names:**
- Format: `mod_<short_id>`
- Example: `mod_abc123` for module with ID `abc123xyz...`
- Utility: `getModuleSchemaName(moduleId)` → `mod_abc123`

**Table Names:**
- Within schema, use descriptive names
- Example: `mod_crm.contacts`, `mod_crm.deals`
- Always plural for collections

**Module Short IDs:**
- First 8 chars of UUID (or generated)
- Utility: `generateModuleShortId()` → `'abc12345'`

### 10. Data Flow Patterns

**Read Flow:**
```
Component → useQuery → Server Action → Supabase → RLS Check → Data
```

**Write Flow:**
```
Form → onSubmit → Server Action → Validation → Supabase → RLS Check → Revalidate → UI Update
```

**Module Install Flow:**
```
1. User clicks "Install Module"
2. Check permissions (agency tier, module compatibility)
3. Create site_modules record
4. Provision module schema (if needed)
5. Run module installation script
6. Grant permissions (RLS policies)
7. Revalidate cache
8. Redirect to configuration
```

### 11. Brand System Architecture (Enterprise)

**Location:** `src/config/brand/`

**Purpose:** Centralized, type-safe configuration for all branding, theming, colors, typography, and SEO. Supports white-labeling for agencies.

**File Structure:**
```
src/config/brand/
├── index.ts              # Main exports (import from here)
├── types.ts              # TypeScript type definitions
├── identity.ts           # Brand name, tagline, SEO, social, analytics
├── tokens.ts             # Typography, spacing, borders, shadows
├── hooks.ts              # React hooks for theme-aware access
├── css-generator.ts      # Generate CSS variables programmatically
└── colors/
    ├── index.ts          # Color scales and semantic colors
    └── utils.ts          # Color manipulation (lighten, darken, contrast)
```

**Color System:**
- HSL-based with CSS variables for runtime theming
- Full 11-shade scales (50-950) matching Tailwind convention
- Brand colors: `primary`, `secondary`, `accent`
- Status colors: `success`, `warning`, `danger`, `info`
- Access via Tailwind: `bg-primary-500`, `text-danger-100`

**React Hook Usage:**
```typescript
import { useBrand, useColors, useIdentity, useLogo } from '@/config/brand/hooks';

// Get everything
const { identity, colors, tokens, theme } = useBrand();

// Get specific parts
const { primary, secondary } = useColors();
const { name, tagline, copyright } = useIdentity();
const logoSrc = useLogo(); // Returns theme-aware logo path
```

**White-Label Support:**
```typescript
import { createSiteConfig, mergeSiteConfig } from '@/config/brand';

// Agency-specific override
const agencyConfig: PartialSiteConfig = {
  identity: { name: 'Agency Brand', tagline: 'Custom tagline' },
  colors: { primary: { base: { hex: '#ff0000' } } }
};
const customConfig = mergeSiteConfig(agencyConfig);
```

**CSS Variable Generation:**
```typescript
import { generateBrandCss } from '@/config/brand';
const css = generateBrandCss(); // Returns complete CSS variable definitions
```

## Critical Implementation Paths

### Path 1: Module Installation
1. Check user has agency_owner/admin role
2. Verify module exists and is published
3. Check if already installed (prevent duplicates)
4. Create database schema (for app/system modules)
5. Insert site_modules record with agency_id + site_id
6. Run module-specific setup (seed data, create defaults)
7. Fire webhook if configured
8. Show success message + redirect to config

### Path 2: Module Runtime Rendering
1. Fetch site_modules record (verify installed)
2. Load module code from modules table
3. Parse component code (SSR or CSR)
4. Inject module config from site_modules.config
5. Establish API context (auth, permissions)
6. Render component
7. Track usage analytics

### Path 3: Module API Request
1. Request to `/api/modules/[moduleId]/endpoint`
2. Verify API key or session auth
3. Check module permissions (RLS)
4. Route to module-specific handler
5. Execute business logic
6. Return JSON response
7. Log API usage

## Technical Decisions

### Why Next.js 15 Server Actions?
- Reduces client-side JavaScript
- Built-in request deduplication
- Type-safe end-to-end
- Simpler than API routes for mutations
- Works with React 19 concurrent features

### Why Supabase?
- PostgreSQL (proven, reliable)
- Built-in Auth with RLS
- Real-time subscriptions
- Edge functions for custom logic
- Generous free tier

### Why Schema-Per-Module?
- Data isolation (security)
- Independent migrations (avoid conflicts)
- Easier debugging (clear namespace)
- Simpler uninstall (drop schema)
- Supports 1000+ modules

### Why Monorepo Structure?
- Shared types between platform and SDK
- Easier code reuse
- Single deploy process
- Consistent tooling

## Performance Patterns

### Caching Strategy
- **Static**: Marketing pages, docs (ISR 1 hour)
- **Dynamic**: Dashboard, modules (no cache, real-time)
- **API**: TanStack Query (5 min stale time)
- **Edge**: CDN for assets, embed scripts

### Database Optimization
- Indexes on all foreign keys
- Composite indexes for multi-tenant queries
- Connection pooling (Supabase built-in)
- RLS policies use indexed columns

### Code Splitting
- Dynamic imports for module code
- Route-based splitting (automatic with Next.js)
- Component-level lazy loading for heavy UI

## Security Patterns

### Input Validation
- Zod schemas for all user input
- Server-side validation (never trust client)
- SQL injection prevention (parameterized queries)
- XSS prevention (React escaping + CSP headers)

### API Security
- Rate limiting (by IP, by user)
- API key rotation
- CORS restrictions
- Webhook signature verification

### Module Sandboxing
- Modules run in isolated context
- No direct file system access
- API calls proxied through gateway
- Resource limits (CPU, memory, database)

## Monitoring & Observability

### Logging
- Server actions: console.log → Vercel logs
- Errors: Captured and stored in error_logs table
- API requests: Request ID tracking
- Module usage: Analytics events

### Metrics to Track
- Module install count
- API request volume per module
- Error rates by module
- Page load times
- Database query performance

---

## 🔔 AUTOMATION EVENT INTEGRATION (CRITICAL FOR NEW MODULES)

**IMPORTANT:** All new modules that create/update/delete data MUST emit automation events.

### Required Event Integration Pattern

When building a new module (CRM, Booking, E-commerce, etc.), you MUST:

1. **Import the event processor:**
```typescript
import { logAutomationEvent } from '@/modules/automation/services/event-processor'
```

2. **Emit events in all CRUD operations:**
```typescript
// After creating a record
await logAutomationEvent(siteId, 'module.entity.created', {
  id: newRecord.id,
  ...newRecord,  // All relevant fields for automation use
}, {
  sourceModule: 'module_name',
  sourceEntityType: 'entity_type',
  sourceEntityId: newRecord.id
})

// After updating a record  
await logAutomationEvent(siteId, 'module.entity.updated', {
  id: record.id,
  ...updatedFields,
  previous: oldValues  // Include previous values for comparisons
})

// After deleting a record
await logAutomationEvent(siteId, 'module.entity.deleted', {
  id: recordId,
  ...deletedRecord
})
```

### Event Naming Convention

**Format:** `{module}.{entity}.{action}`

**Examples:**
- CRM: `crm.contact.created`, `crm.deal.stage_changed`, `crm.deal.won`
- Booking: `booking.appointment.created`, `booking.appointment.confirmed`
- E-commerce: `ecommerce.order.created`, `ecommerce.cart.abandoned`
- Forms: `form.submitted`, `form.field_updated`

### Automation Event Flow (FULLY WORKING ✅)

```
1. Module Action (e.g., createContact())
   ↓
2. logAutomationEvent(siteId, 'crm.contact.created', payload)
   ↓
3. Creates record in automation_events_log
   ↓
4. processEventImmediately() - finds matching subscriptions
   ↓
5. queueWorkflowExecution() - creates execution record
   ↓
6. executeWorkflow() - runs workflow steps (ASYNC)
   ↓
7. Updates workflow_executions & step_execution_logs
```

### Event Registry Location

All supported events are defined in:
`src/modules/automation/lib/event-types.ts`

**When adding a new module, ADD its events to the EVENT_REGISTRY:**
```typescript
export const EVENT_REGISTRY = {
  // ... existing events
  
  'new_module': {
    'entity.created': {
      id: 'new_module.entity.created',
      category: 'New Module',
      name: 'Entity Created',
      description: 'Triggered when a new entity is created',
      trigger_label: 'When entity is created',
      payload_schema: {
        id: 'string',
        name: 'string',
        // ... other fields
      }
    }
  }
}
```

### Current Working Integrations

| Module | Events Emitting | Status |
|--------|-----------------|--------|
| CRM | contact.created, contact.updated, contact.deleted, deal.created, deal.updated, deal.deleted, deal.stage_changed, deal.won, deal.lost | ✅ WORKING |
| Booking | appointment.created, appointment.confirmed, appointment.cancelled | ⏳ To implement |
| E-commerce | order.created, order.paid, cart.abandoned | ⏳ To implement |
| Forms | form.submitted | ⏳ To implement |

### Phase Document Requirements

**ALL future phase documents (EM-50+) MUST include:**

1. **Events to Emit Section:**
   ```markdown
   ## Automation Events
   
   This module emits the following automation events:
   - `module.entity.created` - When X is created
   - `module.entity.updated` - When X is updated
   - etc.
   ```

2. **Event Payload Schema:**
   ```markdown
   ### Event Payloads
   
   #### module.entity.created
   {
     "id": "uuid",
     "field1": "string",
     "field2": "number"
   }
   ```

3. **Integration Code:**
   - Import statement
   - logAutomationEvent calls in each action
   - EVENT_REGISTRY updates

---

## 📊 DATABASE SCHEMA REFERENCE (CRITICAL FOR MIGRATIONS)

**IMPORTANT:** All new migrations MUST be aware of the current schema to avoid conflicts.

### Current Automation Tables (EM-57)

```sql
-- Core workflow tables
automation_workflows          -- Workflow definitions
workflow_steps               -- Steps in each workflow
workflow_executions          -- Execution history
step_execution_logs          -- Detailed step logs

-- Event system
automation_events_log        -- All emitted events
automation_event_subscriptions -- Workflow subscriptions to events

-- Configuration
automation_connections       -- External service connections
automation_webhooks          -- Incoming webhook endpoints
workflow_variables           -- Persistent variables
```

### Key Relationships

```
automation_workflows (1) → (N) workflow_steps
automation_workflows (1) → (N) workflow_executions
automation_workflows (1) → (N) automation_event_subscriptions
workflow_executions (1) → (N) step_execution_logs
sites (1) → (N) automation_workflows
```

### Schema Versioning

When writing migrations:
1. Check existing tables: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
2. Use `IF NOT EXISTS` for creates
3. Use `IF EXISTS` for drops/alters
4. Reference this file for current schema state

### Migration File Naming

**Format:** `{date}_{description}.sql` or `em-{phase}-{description}.sql`

**Examples:**
- `20260126_add_booking_events.sql`
- `em-51-booking-module.sql`

---

## Development Workflow

### Local Development
1. Clone repo
2. Copy `.env.example` → `.env.local`
3. Run `pnpm install`
4. Run `pnpm dev` → http://localhost:3000
5. Connect to Supabase project (or local)

### Module Development
1. Create module in Studio OR use VS Code SDK
2. Test in sandbox environment
3. Deploy to beta (test with real data)
4. Promote to production
5. Publish to marketplace

### Database Changes
1. Write SQL migration in `migrations/`
2. Test locally
3. Run in Supabase SQL editor (dev)
4. Commit migration file
5. Run in production (careful!)

## Key Files Reference

- **Auth**: `src/lib/supabase/server.ts`, `middleware.ts`
- **Modules**: `src/lib/modules/`, `src/app/api/modules/`
- **Database Types**: `src/types/database.ts` (auto-generated)
- **Actions**: `src/lib/actions/*.ts`
- **Components**: `src/components/` (Radix + custom)
- **Migrations**: `migrations/*.sql`
- **Phase Docs**: `phases/enterprise-modules/PHASE-EM-*.md`
- **Platform Docs**: `docs/` (architecture, status, guides)
- **Dashboard Docs**: `next-platform-dashboard/docs/` (testing, deployment guides)
