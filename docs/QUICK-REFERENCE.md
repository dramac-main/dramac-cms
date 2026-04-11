# Quick Reference: DRAMAC CMS Development

**Last Updated**: April 11, 2026  
**Status**: Production-Ready — All Core Waves Complete

---

## Development Commands

```bash
# Navigate to app
cd next-platform-dashboard

# Install dependencies
pnpm install

# Development server (run in separate terminal, NOT via Copilot)
pnpm dev

# TypeScript check (requires extra memory for large types file)
NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit --skipLibCheck

# Deploy (Vercel webhook is intermittent)
npx vercel --prod --yes

# Create super admin
npx tsx scripts/create-super-admin.ts
```

---

## Key File Locations

| Purpose                | Path                                                |
| ---------------------- | --------------------------------------------------- |
| App Routes             | `src/app/`                                          |
| Components             | `src/components/` (500+)                            |
| Server Actions         | `src/lib/actions/`                                  |
| Module Implementations | `src/modules/` (6 modules)                          |
| Studio Engine          | `src/lib/studio/engine/`                            |
| Studio Components      | `src/components/studio/blocks/`                     |
| AI Website Designer    | `src/lib/ai/website-designer/`                      |
| Email System           | `src/lib/email/`                                    |
| Database Types         | `src/types/database.ts` (580K+ chars)               |
| Locale Config          | `src/lib/locale-config.ts`                          |
| Navigation Config      | `src/config/navigation.ts`                          |
| AI Provider Config     | `src/lib/ai/website-designer/config/ai-provider.ts` |

---

## Critical Patterns

### Supabase snake_case → camelCase

```typescript
import { mapRecord, mapRecords } from "@/lib/map-db-record";
// EVERY server action returning raw Supabase data MUST use this
return { items: mapRecords<MyType>(data || []), error: null };
```

### Auth Guard (every server page)

```typescript
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
if (!user) redirect("/login");
```

### Getting Tenant ID

```typescript
const { data: site } = await supabase
  .from("sites")
  .select("agency_id")
  .eq("id", siteId)
  .single();
const tenantId = site?.agency_id || "";
```

### Locale (NEVER hardcode USD/UTC)

```typescript
import {
  DEFAULT_CURRENCY,
  DEFAULT_TIMEZONE,
  formatCurrency,
} from "@/lib/locale-config";
// Zambia: ZMW, K symbol, Africa/Lusaka, 16% VAT
```

### E-Commerce Prices (CENTS)

```typescript
// DB stores cents: K250.00 → 25000
// Display: (price / 100).toFixed(2)
// Save: Math.round(parseFloat(input) * 100)
```

### AI Zod Schemas

```typescript
// ONLY use: z.number(), z.string(), z.array(), z.enum(), z.boolean(), z.object()
// NEVER use: .int(), .min(), .max(), literal numeric unions
```

---

## Module Auto-Install

Core modules installed on every new site (`CORE_MODULE_SLUGS` in sites.ts):

- **CRM** — contact management
- **Automation** — event-driven workflows
- **Live Chat** — customer conversations + AI

E-Commerce and Booking: installed when AI Designer detects industry need.  
Social Media: user-activated manually.

---

## Email Pipelines

| Pipeline                   | File                                             | Use For                             |
| -------------------------- | ------------------------------------------------ | ----------------------------------- |
| Platform (Dramac branding) | `send-email.ts` + `templates.ts`                 | Welcome, billing, password reset    |
| Branded (site branding)    | `send-branded-email.ts` + `branded-templates.ts` | Booking confirmations, order emails |

**Important**: `createNotification()` is IN-APP ONLY — no email. Email sent by caller.

---

## Automation Events

All modules emit via `logAutomationEvent()` — NON-BLOCKING (`.catch(() => {})`).

25+ event types: CRM (contact/deal CRUD), E-Commerce (order lifecycle), Booking (appointment lifecycle), Live Chat (conversation lifecycle).

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://nfirsqmyxmmtbignofgb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=

# Billing
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=

# AI
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=

# Auth
JWT_SECRET=
```
