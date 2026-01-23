# System Patterns: DRAMAC Architecture

**Last Updated**: January 23, 2026

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js Server Actions, API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS policies
- **Billing**: LemonSqueezy
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
