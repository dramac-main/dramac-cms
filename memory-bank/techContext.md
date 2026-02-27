# Tech Context: Technologies & Setup

**Last Updated**: February 19, 2026

## ⚠️ CRITICAL: Development Workflow

### Dev Server Management
**ALWAYS run the dev server in an EXTERNAL/SEPARATE terminal (PowerShell, VS Code terminal, etc.)** - NOT through Copilot commands!

**Why?**
- Running `pnpm dev` through Copilot terminal commands causes interference
- Background processes get killed when running other commands
- Lock file conflicts occur with multiple terminal sessions
- Copilot commands can interrupt the running server

**Correct Workflow:**
1. User starts `pnpm dev` in their own external terminal
2. Copilot focuses on code edits, TypeScript checks, git commands
3. User monitors the dev server output separately
4. When testing routes, user checks in browser while Copilot checks terminal output

**Commands Copilot CAN run:**
- `npx tsc --noEmit --skipLibCheck` - TypeScript checking
- `git add`, `git commit`, `git push` - Version control
- `pnpm install` - Package installation
- File reading/editing operations

**Commands Copilot should AVOID running in background:**
- `pnpm dev` / `npx next dev` - Dev server (user runs externally)
- Long-running processes that need persistent terminals

---

## Technology Stack

### Core Framework
- **Next.js**: 16.1.1 (App Router, React Server Components)
- **React**: 19.2.3 (with concurrent features)
- **TypeScript**: 5.x (strict mode enabled)
- **Node.js**: 20+ required

### Database & Backend
- **Supabase**: PostgreSQL with built-in Auth, RLS, Real-time
- **@supabase/supabase-js**: 2.90.1 (client library)
- **@supabase/ssr**: 0.8.0 (Next.js SSR support)

### UI & Styling
- **Tailwind CSS**: 4.x (utility-first CSS)
- **Radix UI**: Complete component library
  - Dialog, Dropdown, Select, Tooltip, etc.
- **Framer Motion**: 12.26.2 (animations)
- **Lucide React**: 0.562.0 (icons)
- **class-variance-authority**: 0.7.1 (component variants)
- **tailwind-merge**: 3.4.0 (className merging)
- **clsx**: 2.1.1 (conditional classes)

### Editors & Builders
- **Monaco Editor**: 4.7.0 (VS Code editor in browser)
- **Craft.js**: 0.2.12 (page builder core)
- **TipTap**: 3.15.3 (rich text editor)
  - Extensions: Image, Link, Placeholder, TextAlign

### State Management
- **Zustand**: 5.0.10 (client-side state)
- **TanStack Query**: 5.90.16 (server state, caching)
- **React Hook Form**: 7.71.0 (form state)
- **Zod**: 4.3.5 (schema validation)

### Billing & Payments
- **Paddle**: (Phase EM-59) - Merchant of Record, usage-based billing ⭐ PREFERRED
  - Primary billing provider for DRAMAC platform
  - Supports Zambia payouts via Payoneer/Wise
  - Payout route: Paddle → Payoneer/Wise → Zambia Bank
  - Features: Hybrid pricing (subscription + usage overage), dunning, tax compliance
- **LemonSqueezy**: 4.0.0 (DEPRECATED - to be replaced by Paddle)
  - Does NOT support Zambia payouts
  - Will be removed after Paddle migration
- **Stripe**: (NOT USED for platform billing)
  - Only mentioned in legacy code/database types

### ⚠️ E-Commerce Price Storage (CRITICAL)
- **ALL monetary values stored as CENTS (integers)** — e.g., $250.00 → 25000
- Product create: `Math.round(parseFloat(input) * 100)` (dollars → cents for DB)
- Product edit display: `(product.base_price / 100).toFixed(2)` (cents → dollars for UI)
- Cart items: raw `product.base_price` (cents)
- Orders: `unit_price * quantity` (all cents)
- Checkout API: `total / 100` to convert cents to dollars for payment providers
- **DO NOT remove `/100` divisions** — they convert cents to display dollars
- **Phase doc PHASE-ECOM-PRODUCTION-READY.md Section 19 is WRONG** about "decimal not cents"
  - May be used by E-commerce module for client stores (optional)
  - NOT for DRAMAC platform subscription billing

### AI & Automation
- **AI SDK**: 6.0.33 (Vercel AI SDK)
- **@ai-sdk/anthropic**: 3.0.12 (Claude — **PRIMARY PROVIDER**)
- **@ai-sdk/openai**: 3.0.26 (OpenAI — fallback only, not used for website generation)
- **@anthropic-ai/sdk**: 0.71.2 (Anthropic API)
- **AI Provider Config**: `config/ai-provider.ts` — centralized model selection via `getAIModel(task)`
- **Claude Model IDs (Latest Feb 2026)**:
  - Sonnet 4.6: `claude-sonnet-4-6` (premium tier — used for all main AI Designer tasks)
  - Haiku 4.5: `claude-haiku-4-5-20251001` (fast tier — module analysis, responsive, design inspiration)
  - Opus 4.6: `claude-opus-4-6` (available but not currently used)
- **AI Website Designer**: Multi-step architecture — 3 API endpoints, client orchestrates sequentially
- **⚠️ Zod Schema Rule**: AI-facing schemas must NOT use `.int()`, `.min()`, `.max()`, literal numeric unions — Claude rejects `integer` type and `minimum`/`maximum`/`minItems`/`maxItems` properties
- **⚠️ IMPORTANT**: OpenAI was tried and reverted. Its strict structured output mode is incompatible with our rich Zod schemas. Do NOT switch back without solving schema compatibility.
- **Automation Engine**: ✅ COMPLETE (EM-57) - Workflows, triggers, event processing
- **AI Agents System**: (Phase EM-58) - Intelligent agents with memory, tools, goals

### Communication
- **Resend**: 6.7.0 (transactional emails via REST API)
  - SDK: `src/lib/email/resend-client.ts` — `getResend()`, `isEmailEnabled()`, `getEmailFrom()`
  - Sender: `Dramac <noreply@app.dramacagency.com>` (verified domain: `app.dramacagency.com`)
  - Also used as Supabase Auth SMTP (login/signup/reset emails)
  - SMTP: `smtp.resend.com:465` — configured in Supabase Dashboard
- **Handlebars**: 4.7.8 (email templates)

### Localization
- **Default Locale**: `en-ZM` (Zambia)
- **Default Currency**: `ZMW` (Zambian Kwacha, symbol: `K`)
- **Default Timezone**: `Africa/Lusaka` (UTC+2)
- **Config**: `src/lib/locale-config.ts` — centralized, all modules import from here
- **NEVER hardcode** `en-US`, `USD`, `$`, `UTC` — use constants from locale-config

### Utilities
- **date-fns**: 4.1.0 (date manipulation)
- **uuid**: 13.0.0 (UUID generation)
- **jsonwebtoken**: 9.0.3 (JWT tokens)
- **fs-extra**: 11.3.3 (file operations)
- **sonner**: 2.0.7 (toast notifications)
- **cmdk**: 1.1.1 (command palette)
- **recharts**: 3.7.0 (charts & graphs)

### Development Tools
- **ESLint**: 9.x (linting)
- **Prettier**: (code formatting via IDE)
- **TypeScript**: (type checking)
- **dotenv**: 17.2.3 (environment variables)
- **pnpm**: Package manager

---

## 🔌 MCP Tools (Model Context Protocol) — AI Can Use These Directly

**IMPORTANT**: This workspace has MCP servers configured. AI assistants can interact with external services DIRECTLY instead of asking the user to run commands manually.

### Available MCP Servers

#### 1. Supabase MCP
- **Execute SQL**: Run any SQL query against the production database
  - Tool: `mcp_supabase_execute_sql` (project_id: `nfirsqmyxmmtbignofgb`)
  - Use for: checking data, debugging issues, verifying migrations worked
- **Apply Migrations**: Run DDL migrations directly
  - Tool: `mcp_supabase_apply_migration`
  - Use for: creating tables, adding columns, creating policies
- **Generate Types**: Generate TypeScript types from the database schema
  - Tool: `mcp_supabase_generate_typescript_types`

**Supabase Project ID**: `nfirsqmyxmmtbignofgb`
**Supabase URL**: `https://nfirsqmyxmmtbignofgb.supabase.co`

**When to use Supabase MCP:**
- Verifying data after a fix (e.g., "did the currency actually change?")
- Running one-off data fixes (UPDATE stale rows)
- Checking table schemas, RLS policies, storage buckets
- Debugging: "why is this component showing wrong data?" → query the DB directly
- Running migration SQL files instead of asking the user to paste into SQL Editor

#### 2. Vercel MCP
- **Search Docs**: Search Vercel documentation
- **Check Deployments**: List and inspect deployments
- **Domain Management**: Check domain availability
- Use for: debugging deployment issues, checking build logs, Vercel config questions

#### 3. Cloudflare MCP
- **DNS Management**: View DNS settings, get DNS reports
- **Search Docs**: Search Cloudflare documentation
- Use for: domain/DNS configuration, Cloudflare-related debugging

#### 4. Context7 MCP
- **Query Library Docs**: Get up-to-date documentation for any library
- **Resolve Library IDs**: Find the right library identifier
- Use for: checking latest API docs for Next.js, Supabase, React, etc.

#### 5. Paddle MCP
- **Billing Management**: Create/list customers, transactions, subscriptions
- **Pricing**: Preview prices, manage discounts and products
- Use for: billing/payment debugging, customer lookup

### MCP Usage Rules
1. **Always prefer MCP over asking the user** — if you can check or fix something directly, do it
2. **Verify after fixing** — after running an UPDATE, SELECT to confirm it worked
3. **Be careful with mutations** — SELECT queries are safe; UPDATE/DELETE should be intentional
4. **Use for debugging** — when something looks wrong on the UI, query the DB to see what's actually stored
5. **Migrations**: For schema changes (CREATE TABLE, ALTER TABLE), prefer `mcp_supabase_apply_migration`. For data fixes (UPDATE, INSERT), use `mcp_supabase_execute_sql`

---

## Development Environment Setup

### Prerequisites
```bash
# Required installations
- Node.js 20+
- pnpm (npm install -g pnpm)
- Git
- VS Code (recommended)
```

### Initial Setup
```bash
# 1. Clone repository
git clone https://github.com/dramac-main/dramac-cms.git
cd dramac-cms/next-platform-dashboard

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env.local

# 4. Configure Supabase
# Add to .env.local:
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# 5. Run development server
pnpm dev

# Open http://localhost:3000
```

### Environment Variables

**Required:**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Optional:**
```env
# Paddle (PRIMARY billing - Zambia-compatible)
PADDLE_API_KEY=pdl_live_xxx
PADDLE_WEBHOOK_SECRET=pdl_whk_xxx
PADDLE_ENVIRONMENT=production
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=xxx

# LemonSqueezy (DEPRECATED - being replaced by Paddle)
# LEMONSQUEEZY_API_KEY=
# LEMONSQUEEZY_STORE_ID=
# LEMONSQUEEZY_WEBHOOK_SECRET=

# Resend (Email)
RESEND_API_KEY=

# Stripe (NOT for platform billing - optional for E-commerce client stores only)
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=

# Anthropic AI
ANTHROPIC_API_KEY=

# JWT
JWT_SECRET=your-secret-key
```

## Project Scripts

```json
{
  "dev": "next dev",                    // Development server
  "build": "next build",                // Production build
  "start": "next start",                // Production server
  "lint": "eslint",                     // Lint code
  "admin:create": "npx tsx scripts/create-super-admin.ts",
  "admin:promote": "npx tsx scripts/create-super-admin.ts"
}
```

## Technical Constraints

### Browser Support
- **Modern browsers only** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **ES2020** features required
- **No IE11 support**

### Performance Targets
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

### Database Limits (Supabase Free Tier)
- **Storage**: 500 MB
- **Bandwidth**: 5 GB/month
- **Realtime connections**: 200 concurrent
- **Edge functions**: 500,000 invocations/month

### Deployment Constraints
- **Vercel Free Tier**:
  - 100 GB bandwidth/month
  - 100 hours build time/month
  - 6,000 minutes serverless execution
- **Max request size**: 4.5 MB
- **Max response size**: 4.5 MB
- **Function timeout**: 10s (Hobby), 60s (Pro)

## Architecture Decisions

### Why App Router (vs Pages Router)?
- ✅ React Server Components (less client JS)
- ✅ Native streaming and suspense
- ✅ Better data fetching (server actions)
- ✅ Improved layouts and nested routing
- ✅ Future of Next.js

### Why Server Actions (vs API Routes)?
- ✅ Type-safe end-to-end
- ✅ Automatic request deduplication
- ✅ Better DX (co-located with components)
- ✅ Less boilerplate
- ⚠️ Still use API routes for webhooks/external APIs

### Why Supabase (vs other databases)?
- ✅ PostgreSQL (mature, reliable)
- ✅ Built-in Auth + RLS (security)
- ✅ Real-time subscriptions
- ✅ Storage included
- ✅ Generous free tier
- ✅ Edge functions support

### Why pnpm (vs npm/yarn)?
- ✅ Faster installation
- ✅ Disk space efficient
- ✅ Strict dependency resolution
- ✅ Monorepo support

### Why Radix UI (vs other component libraries)?
- ✅ Unstyled (full design control)
- ✅ Accessible by default (ARIA)
- ✅ Composable primitives
- ✅ Tree-shakeable
- ✅ Works with Tailwind

## Common Development Patterns

### Creating a New Page
```typescript
// src/app/(dashboard)/new-page/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function NewPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('table').select();
  
  return <div>{/* content */}</div>;
}
```

### Creating a Server Action
```typescript
// src/lib/actions/example.ts
"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('items')
    .insert({ name: formData.get('name') });
  
  if (error) {
    return { error: error.message };
  }
  
  revalidatePath('/items');
  return { data };
}
```

### Creating an API Route
```typescript
// src/app/api/webhook/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Process webhook
  
  return Response.json({ success: true });
}
```

### Using Client State
```typescript
"use client"

import { useQuery } from '@tanstack/react-query';

export function Component() {
  const { data, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await fetch('/api/items');
      return res.json();
    }
  });
  
  return <div>{/* render */}</div>;
}
```

## Testing Strategy

### Current State
- **Manual testing** in development
- **No automated tests yet** (planned for future)

### Planned Testing
- **Unit tests**: Vitest
- **Integration tests**: Playwright
- **E2E tests**: Playwright
- **Type checking**: TypeScript strict mode

## Deployment

### Production Environment
- **Platform**: Vercel
- **Database**: Supabase (hosted)
- **Domain**: TBD
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics (optional)

### Deployment Process
```bash
# Automatic on git push to main
git push origin main

# Or manual deploy
vercel --prod
```

### Environment Variables (Production)
- Set in Vercel dashboard
- Never commit to git
- Use secrets for sensitive values

## Database Management

### Running Migrations
```bash
# 1. Write SQL in migrations/ folder
# 2. Open Supabase Dashboard
# 3. Go to SQL Editor
# 4. Paste migration content
# 5. Run query
# 6. Verify in Table Editor
```

### Generating Types
```bash
# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

### Backup Strategy
- **Automatic**: Supabase daily backups (7 days retention)
- **Manual**: Export SQL via dashboard
- **Scripts**: `scripts/supabase-full-export.sql`

## Key Dependencies Explained

### Monaco Editor
- Full VS Code editor in browser
- Used for Module Studio code editing
- Syntax highlighting, autocomplete, error checking

### Craft.js
- Visual page builder framework
- Drag-and-drop interface
- Component serialization
- Used for website builder

### TipTap
- Headless rich text editor
- Based on ProseMirror
- Extensible with plugins
- Used for content editing

### React Hook Form + Zod
- Form state management
- Schema validation
- Type-safe forms
- Error handling

### TanStack Query
- Server state caching
- Background refetching
- Optimistic updates
- Request deduplication

## Tool Configuration

### TypeScript Config
- **Strict mode**: Enabled
- **Path aliases**: `@/*` → `src/*`
- **Target**: ES2020
- **Module**: ESNext
- **JSX**: React

### Tailwind Config
- **Dark mode**: Class-based
- **Custom colors**: Brand palette
- **Plugins**: tailwindcss-animate
- **Content**: All src files

### ESLint Config
- **Extends**: next/core-web-vitals
- **Parser**: TypeScript
- **Rules**: Next.js recommended

## VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "supabase.supabase-vscode"
  ]
}
```

## Common Issues & Solutions

### Issue: Supabase connection fails
**Solution**: Check environment variables, verify project URL and keys

### Issue: Module not found errors
**Solution**: Clear `.next` folder, restart dev server

### Issue: Type errors after schema changes
**Solution**: Regenerate types from Supabase

### Issue: RLS policies blocking queries
**Solution**: Check policy conditions, verify user authentication

### Issue: Build fails on Vercel
**Solution**: Check environment variables are set in Vercel dashboard

## Performance Optimization

### Code Splitting
- Dynamic imports for large modules
- Route-based automatic splitting
- Component-level lazy loading

### Image Optimization
- Use Next.js Image component
- WebP format with fallbacks
- Responsive sizes

### Database Query Optimization
- Select only needed columns
- Use indexes on foreign keys
- Limit results with pagination
- Cache with TanStack Query

### Bundle Size Management
- Check with `pnpm build`
- Tree-shake unused code
- Dynamic imports for heavy libraries
- Monitor with Vercel analytics

## Security Practices

### Authentication
- Supabase Auth with secure cookies
- JWT tokens with expiration
- Session refresh in middleware
- CSRF protection built-in

### Authorization
- Row-level security (RLS) on all tables
- Policy checks on every query
- Role-based access control
- API key rotation

### Data Protection
- HTTPS only
- Encrypted database connections
- Secure environment variables
- Input validation with Zod

## Monitoring & Debugging

### Development
- Next.js dev server logs
- Browser DevTools
- React DevTools
- Network tab for API calls

### Production
- Vercel logs
- Supabase logs
- Error boundaries
- Performance metrics

## Future Tech Considerations

### Planned Additions
- **Testing framework** (Vitest + Playwright)
- **E2E tests** for critical paths
- **Monitoring** (Sentry or similar)
- **Analytics** (PostHog or Mixpanel)
- **Feature flags** (for gradual rollouts)

### Under Evaluation
- **Real-time collaboration** (for module editing)
- **Background jobs** (for long-running tasks)
- **Search** (Algolia or Typesense)
- **CDN** (for module assets)
