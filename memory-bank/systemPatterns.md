# System Patterns: DRAMAC Architecture

**Last Updated**: February 2026

## Development Workflow

### Git Commit Pattern
**CRITICAL**: Always verify TypeScript compilation before committing:
```bash
# 1. Check for TypeScript errors
npx tsc --noEmit

# 2. If zero errors, commit and push immediately
git add -A
git commit -m "feat: [descriptive message]"
git push
```

**Guideline**: After completing any phase or significant feature:
1. Run `npx tsc --noEmit` to verify zero errors
2. If successful, immediately commit with descriptive message
3. Push to remote repository
4. Update memory bank with completion status

### MCP Tools — Direct Service Access
**This workspace has MCP (Model Context Protocol) servers configured.** AI assistants can directly:
- **Query/update the Supabase database** (project: `nfirsqmyxmmtbignofgb`) — no need to ask the user to run SQL manually
- **Check Vercel deployments** and search Vercel/Cloudflare docs
- **Look up library documentation** via Context7
- **Manage Paddle billing** entities

**See `techContext.md` → "MCP Tools" section for full details, tool names, and usage rules.**

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
- **Editor**: DRAMAC Studio (custom dnd-kit based) - Replacing Puck (Feb 2026)
- **Rich Text**: TipTap
- **Email**: Resend (transactional + auth SMTP)
- **AI Models**: Claude Sonnet 4.6 (`claude-sonnet-4-6`), Haiku 4.5 (`claude-haiku-4-5-20251001`), Opus 4.6 (`claude-opus-4-6`)

---

## 🤖 AI Multi-Step API Pattern (CRITICAL for Vercel Hobby)

### Problem
Vercel Hobby plan limits serverless functions to **60s max**. Complex AI operations (multiple Claude API calls) can't fit in a single function.

### Solution: Client-Side Orchestration
Split long AI operations into **multiple API endpoints**, each with its own 60s budget. The client calls them sequentially.

```
Client (browser)
  ├── Step 1: POST /api/ai/.../steps/architecture → 60s budget
  ├── Step 2: POST /api/ai/.../steps/pages → 60s budget (uses Step 1 output)
  └── Step 3: POST /api/ai/.../steps/finalize → 60s budget (uses Steps 1+2 output)
```

### Rules
1. **Each endpoint MUST have `export const maxDuration = 60`** (Next.js segment config)
2. **Each step must independently rebuild context** — separate serverless functions don't share memory
3. **Pass results between steps via JSON** in request body (architecture, pages, formattedContext)
4. **Client tracks progress** with fixed percentage updates per step
5. **Auth is checked in every endpoint** — user could call any step independently

### Zod Schema Rules for Claude API
AI-facing Zod schemas must NOT use:
- `.int()` → produces `integer` type (unsupported by Claude)
- `.min()` / `.max()` → produces `minimum`/`maximum`/`minItems`/`maxItems` (unsupported)
- `z.union([z.literal(1), z.literal(2), ...])` on numbers → produces integer with constraints
- **ONLY use:** `z.number()`, `z.string()`, `z.array()`, `z.enum()`, `z.boolean()`, `z.object()`

### Vercel Deployment
- GitHub App integration webhook **intermittently fails** to trigger deployments
- **Workaround:** Deploy via `npx vercel --prod --yes` from CLI
- `vercel.json` wildcard: `"src/app/api/ai/**/*.ts": { "maxDuration": 60 }`

---

## 🗄️ Supabase Snake_case → CamelCase Pattern (CRITICAL)

### Problem
Supabase PostgreSQL returns **snake_case** column names (`account_name`, `created_at`, `site_id`), but all TypeScript interfaces use **camelCase** (`accountName`, `createdAt`, `siteId`). Without explicit mapping, accessing `record.accountName` on raw Supabase data returns `undefined`.

### Solution: `map-db-record.ts`
```typescript
import { mapRecord, mapRecords } from '../lib/map-db-record'

// For arrays:
return { items: mapRecords<MyType>(data || []), error: null }

// For singles:
return { item: data ? mapRecord<MyType>(data) : null, error: null }
```

### Rules
1. **EVERY server action** that returns raw Supabase `data` MUST use `mapRecord()`/`mapRecords()`
2. Actions that only return `{ success: boolean }` or construct their own objects do NOT need mapping
3. The `(supabase as any)` cast means TypeScript CANNOT catch these mismatches — manual discipline required
4. When adding new action files, always import and apply mapping

---

## 🔑 Getting tenantId Pattern (CRITICAL)

### Correct Pattern
```typescript
const { data: site } = await supabase
  .from('sites')
  .select('agency_id')
  .eq('id', siteId)
  .single()
const tenantId = site?.agency_id || ''
```

### NEVER DO THIS
```typescript
// WRONG: Social accounts may not exist, and Supabase returns snake_case
const tenantId = accountsResult.accounts?.[0]?.tenantId || ''  // Always ''!
```

---

## 🔐 Server Page Auth Guard Pattern (CRITICAL)

### Every server page MUST have:
```typescript
import { redirect } from 'next/navigation'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')  // Always '/login', never '/auth/login'

// After guard, user is guaranteed non-null:
const userId = user.id  // NOT user?.id || ''
```

### Turbopack Rule
`'use client'` components MUST NOT contain inline `'use server'` annotations. Import server actions as functions instead.

---

## 🧭 Smart Navigation System (Module-Aware Navbar & Footer)

### Problem
Navigation headers were 100% static — links baked into page JSON at AI generation time. Enabling a module (Booking, E-commerce) had ZERO effect on the navbar. The ecommerce install hook wrote nav items to `site.settings.navigation` but that data was **NEVER READ** at render time. No utility area existed for cart/calendar icons. Footer had zero module awareness.

### Architecture
```
site.settings.navigation (DB)  ─┐
                                 ├─→ getModuleNavigation() ─→ SiteNavigation { main[], utility[], footer[] }
modules[] (installed modules)  ──┘
                                         │
    ┌────────────────────────────────────┘
    ▼
ComponentRenderer (renderer.tsx)
    ├── type === "Navbar" → mergeMainNavLinks() + buildUtilityItems() → injectedProps
    └── type === "Footer" → mergeFooterLinks() → injectedProps.columns
```

### Key Files
| File | Role |
|------|------|
| `src/lib/studio/engine/smart-navigation.ts` | Types, constants (BOOKING_NAV_ITEMS etc.), merge functions, icon normalization |
| `src/lib/studio/blocks/premium-components.tsx` | UtilityIcon component, `utilityItems` prop on PremiumNavbarRender |
| `src/lib/studio/engine/renderer.tsx` | Runtime injection in ComponentRenderer for Navbar/Footer |
| `src/lib/ai/website-designer/prompts.ts` | AI told not to add module links (injected automatically) |

### Design Decisions
- **Runtime merge (not bake-time)**: Module nav items merged at render time, so enabling/disabling a module instantly updates navigation
- **Dual source**: Ecommerce uses settings.navigation (persisted by install hook); Booking uses runtime detection from modules array
- **Deduplication by href**: Prevents duplicate links if AI already generated a matching link
- **Insert before "Contact"**: Module main links placed before Contact for natural ordering
- **Icon normalization**: Maps PascalCase (ShoppingCart) → lowercase (cart) for UtilityIcon

---

## 🎨 Brand Color Inheritance System (CRITICAL for Color Consistency)

### Problem
AI-generated websites had inconsistent colors. 146 color fields across 6 booking/ecommerce studio components, 83% with no defaults. Two separate branding systems that didn't connect. Theme CSS variables were dead code. E-commerce components used shadcn/ui which read CSS variables from the dashboard's dark/light mode, causing dark mode to leak onto published sites.

### Architecture (THREE Layers)
```
site.settings.primary_color  ──┐
site.settings.secondary_color ─┤
site.settings.accent_color   ──┼──► resolveBrandColors() ──► BrandColorPalette (30+)
site.settings.theme.* ────────┤                                    │
site.settings.font_heading ────┤                      ┌────────────┴──────────────┐
site.settings.font_body ───────┘                      │                           │
                                                      ▼                           ▼
                                           generateBrandCSSVars()     injectBrandColors()
                                                      │                           │
                                               CSS custom props           fills unset props
                                               on .studio-renderer       for booking/custom
                                                      │                   components
                                                      ▼
                                            ALL shadcn components
                                            (bg-card, text-foreground,
                                             bg-primary, etc.) use
                                             SITE's colors, not dashboard's
```

### Key Files
- **`src/lib/studio/engine/brand-colors.ts`** — Core utility: palette resolution, color mapping, injection, font injection, AND CSS variable generation
- **`src/lib/studio/engine/renderer.tsx`** — Resolves palette from siteSettings, injects colors AND fonts into every component, generates CSS vars, loads Google Fonts
- **`src/app/globals.css`** — `.studio-renderer` CSS isolation rules (light mode, font inheritance, border reset)

### How It Works
1. `resolveBrandColors(source)` derives 30+ semantic colors from 5 core brand colors
2. `generateBrandCSSVars(palette, fontHeading, fontBody)` converts palette to CSS custom properties (HSL for Tailwind, hex for shadcn, fonts)
3. `BRAND_COLOR_MAP` maps ~65 component color prop names to palette keys
4. `BRAND_FONT_MAP` maps 5 component font prop names to heading/body font sources
5. `injectBrandColors(props, palette)` fills any unset color prop with the brand-derived value
6. `injectBrandFonts(props, fontHeading, fontBody)` fills any unset font prop with the brand font
7. Renderer spreads CSS vars on `.studio-renderer` wrapper AND calls `injectBrandColors` + `injectBrandFonts` for every component

### FOUR Layers of Enforcement
1. **CSS Variable Layer** — `generateBrandCSSVars()` overrides `--color-card`, `--color-foreground`, `--font-sans`, `--font-display` etc. on `.studio-renderer`. All shadcn/Tailwind utilities inside published sites use site brand colors and fonts.
2. **Color Prop Injection Layer** — `injectBrandColors()` fills component color props (for booking/custom components that use inline styles)
3. **Font Prop Injection Layer** — `injectBrandFonts()` fills component font props (`titleFont`, `titleFontFamily`, `nameFont`, `fontFamily`, etc.) with brand heading/body fonts. **Treats legacy `"system-ui, -apple-system, sans-serif"` as unset** (old pages stored this before the brand system existed).
4. **AI Prompts** (prompts.ts, formatter.ts) mandate the AI use brand colors

### CRITICAL: Legacy Font Value Handling
Old pages stored `fontFamily: "system-ui, -apple-system, sans-serif"` in DB props before the brand font system. `injectBrandFonts()` treats this value as "unset" alongside `null`, `undefined`, and `""`:
```typescript
const LEGACY_SYSTEM_FONT = "system-ui, -apple-system, sans-serif";
const isUnset = currentValue === undefined || currentValue === null || currentValue === "" || currentValue === LEGACY_SYSTEM_FONT;
```

### CRITICAL: Inline fontFamily Guard Pattern
All `fontFamily` inline styles MUST use `|| undefined` to prevent empty strings from overriding the CSS cascade:
```typescript
// ✅ CORRECT — empty/falsy font doesn't override CSS variables
style={{ fontFamily: titleFont || undefined }}

// ❌ WRONG — empty string "" becomes font-family: "" in CSS, blocks cascade
style={{ fontFamily: titleFont }}
```

### CRITICAL RULES for Storefront Components
**NEVER** do any of the following in storefront-facing components:
- Use `dark:` Tailwind variants (published sites are ALWAYS light)
- Use hardcoded Tailwind colors (`bg-white`, `bg-gray-900`, `text-gray-600`)
- Use hardcoded hex in `defaultProps` (`'#8B5CF6'`) — use empty string
- Set `color-scheme: dark` or add `.dark` class

**ALWAYS**:
- Use semantic Tailwind classes: `bg-card`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border`
- Accept color props and let brand injection fill them
- Keep defaultProps color fields as empty strings (`''`)

### Design Token Persistence
When AI designer saves, `persistDesignTokensAction` in `sites.ts` writes `architecture.designTokens` to `site.settings.theme`, creating the bridge: AI → DB → renderer. It now ALWAYS overwrites flat branding fields (primary_color, secondary_color, etc.) to keep them in sync.

### Site Branding Settings UI
Individual sites have a **"Branding" tab** in site settings (`/dashboard/sites/[siteId]/settings?tab=branding`) that lets users edit brand colors and fonts. This is the **central location** for all branding — changes propagate everywhere through the CSS variable system.

**Key actions:**
- `getSiteBrandingAction(siteId)` — Reads flat fields with `theme.*` fallback
- `updateSiteBrandingAction(siteId, branding)` — Writes to BOTH flat fields AND `theme.*` for full compatibility

### Booking Component Distinction (CRITICAL)
- **`BookingWidget`** (BookingWidgetBlock.tsx): Full 5-step wizard (Service → Staff → Date/Time → Details → Confirmation). Uses real data hooks. Has `handleConfirm` → `createBooking()`. **Use for /book pages.**
- **`BookingServiceSelector`** (ServiceSelectorBlock.tsx): Browse-only catalog. Select just highlights. No booking flow. **Use for embedding service lists in other pages.**

### Color Fallback Pattern in Booking Components
```typescript
const pc = primaryColor || 'var(--brand-primary, #8B5CF6)'
const btnTxt = buttonTextColor || 'var(--brand-button-text, #ffffff)'
// Use pc, btnTxt in all JSX — never raw primaryColor/buttonTextColor
```

### Site Settings Fields
```sql
primary_color    -- Main brand color (e.g., '#0a7c6e')
secondary_color  -- Secondary brand color
accent_color     -- Accent/highlight color
background_color -- Page background
text_color       -- Default text color
font_heading     -- Google Font name for headings (e.g., 'Poppins')
font_body        -- Google Font name for body text (e.g., 'Inter')
```

---

## 🇿🇲 Locale & Currency Pattern (CRITICAL)

### Centralized Locale Config
**ALL locale/currency/timezone defaults MUST come from `src/lib/locale-config.ts`.**

```typescript
import { DEFAULT_CURRENCY, DEFAULT_TIMEZONE, formatCurrency } from '@/lib/locale-config';
```

**NEVER hardcode** `'en-US'`, `'USD'`, `'$'`, `'UTC'` anywhere. Always use:
- `DEFAULT_LOCALE` (`'en-ZM'`)
- `DEFAULT_CURRENCY` (`'ZMW'`)
- `DEFAULT_CURRENCY_SYMBOL` (`'K'`)
- `DEFAULT_TIMEZONE` (`'Africa/Lusaka'`)
- `DEFAULT_COUNTRY` (`'ZM'`)
- `DEFAULT_TAX_RATE` (`16`)
- `formatCurrency(amount)`, `formatDate(date)`, etc.

### When Adding New Modules
1. Import from `@/lib/locale-config` — NOT hardcode defaults
2. Use `formatCurrency()` for all money displays
3. Use `DEFAULT_TIMEZONE` for all date/time calculations
4. Add ZMW to any currency enum/dropdown

---

## 📧 Email & Notification Pattern

### Email Architecture (Dual System)
```
src/lib/email/
├── resend-client.ts              # Resend SDK init (getResend(), isEmailEnabled(), getEmailFrom())
├── send-email.ts                 # LEGACY: sendEmail(to, type, data) → platform-level emails (welcome, billing, etc.)
├── send-branded-email.ts         # BRANDED: sendBrandedEmail(agencyId, opts) → customer-facing emails with site branding
├── email-branding.ts             # Agency + site branding resolution (getAgencyBranding → applySiteBranding overlay)
├── email-types.ts                # EmailType union (18 types) + data interfaces
├── templates.ts                  # LEGACY: HTML templates (hardcoded "Dramac" — platform emails only)
├── templates/branded-templates.ts # BRANDED: Dynamic templates with (data, branding) => string
└── index.ts                      # Re-exports
```

### ⚠️ CRITICAL: Two Email Pipelines
1. **Legacy Pipeline** (`send-email.ts` + `templates.ts`): Platform-level emails only — welcome, password reset, billing alerts. Shows "Dramac" branding. This is INTENTIONAL for platform communications.
2. **Branded Pipeline** (`send-branded-email.ts` + `branded-templates.ts` + `email-branding.ts`): Customer-facing emails — booking confirmations, order confirmations, shipping notifications. Shows site-specific branding (logo, colors, name) with agency fallback.

### Email Branding Resolution Order
```
sendBrandedEmail(agencyId, { siteId?, emailType, to, data })
  └── getAgencyBranding(agencyId)  → agency base branding from DB
       └── applySiteBranding(agencyBranding, siteId)  → overlays site colors/logo/name
            └── buildEmailBranding(merged)  → final EmailBranding object
                 └── branded template renders with branding.primaryColor, branding.companyName, etc.
```

### CRITICAL: Always pass siteId for customer-facing emails
All `sendBrandedEmail` calls in `business-notifications.ts` and `order-actions.ts` MUST include `siteId` so the customer gets the site's branding, not the agency default.

### Notification Architecture
```
src/lib/services/
├── notifications.ts              # createNotification() → DB insert ONLY (no email!)
└── business-notifications.ts     # Orchestrator (handles BOTH in-app + email):
                                  #   notifyNewBooking(), notifyBookingCancelled()
                                  #   notifyNewOrder(), notifyOrderShipped()
```

### ⚠️ CRITICAL: No Dual Email
`createNotification()` is IN-APP ONLY. It inserts into the `notifications` table and returns.
It does NOT send email. All email is handled by the caller via `sendEmail()` from `@/lib/email/send-email`.
This prevents duplicate emails (the old bug where owners got 2 emails per event).

### Adding New Notification Types
1. Add type to `NotificationType` union in `src/types/notifications.ts`
2. Add email type to `EmailType` union in `email-types.ts`
3. Add data interface in `email-types.ts`
4. Add HTML+text template in `templates.ts`
5. Add to `notificationTypeInfo` display map in `notifications.ts`
6. Create orchestrator function in `business-notifications.ts` that calls:
   - `createNotification()` for in-app notification
   - `sendEmail()` for each recipient (owner, customer)
7. Wire into the server action that creates the entity

### Business-Critical Notification Scenarios
| Scenario | Trigger File | In-App | Owner Email | Customer Email |
|----------|-------------|--------|-------------|----------------|
| New Booking | `public-booking-actions.ts` | ✅ | ✅ | ✅ |
| Booking Cancelled | `booking-actions.ts` | ✅ | ✅ | ✅ |
| New Order | `ecommerce-actions.ts` | ✅ | ✅ | ✅ |
| Order Shipped | `ecommerce-actions.ts` | — | — | ✅ |
| Form Submission | `api/forms/submit/route.ts` | — | ✅ | — |
| Payment Failed | `dunning-service.ts` + `stripe/route.ts` | ✅ | ✅ | — |
| Trial Ending | `stripe/route.ts` | ✅ | ✅ | — |
| Payment Recovered | `dunning-service.ts` | ✅ | ✅ | — |

### Auth Email (Supabase SMTP)
Login/signup/reset emails go through Supabase Auth SMTP → Resend:
- Configure in Supabase Dashboard → Authentication → SMTP Settings
- See `src/lib/email/resend-smtp-config.ts`

---

## 🚀 DRAMAC Studio - Website Editor (NEW - February 2026)

### Why Custom Editor (Replacing Puck)

| Limitation in Puck | Solution in Studio |
|-------------------|-------------------|
| UI not customizable | 100% custom panels using DRAMAC design system |
| DropZone limitations | Full control over nesting logic |
| No native AI | AI chat built into every component |
| No module support | Dynamic component loading from modules |
| Limited field types | Custom field system (spacing, typography, etc.) |
| External dependency | We own the code |

### Studio Tech Stack

```
@dnd-kit/core + sortable  → Drag & Drop
zustand + zundo           → State + Undo/Redo  
react-resizable-panels    → Panel layout
react-colorful            → Color picker
react-hotkeys-hook        → Keyboard shortcuts
@ai-sdk/anthropic         → AI (existing)
@tiptap/react             → Rich text (existing)
```

### Studio Routes

```
NEW:  /studio/[siteId]/[pageId]              ← Full-screen editor
OLD:  /dashboard/sites/[siteId]/editor       ← Removed after migration
```

### Studio File Structure

```
src/
├── app/studio/[siteId]/[pageId]/     # Full-screen route
├── components/studio/                 # Editor components
│   ├── core/      → Canvas, providers
│   ├── panels/    → Left, right, bottom, top
│   ├── fields/    → Field editors
│   ├── ai/        → AI chat, generator
│   └── dnd/       → Drag & drop
├── lib/studio/                        # Logic
│   ├── store/     → Zustand stores
│   ├── registry/  → Component definitions
│   └── engine/    → Renderer
└── types/studio.ts
```

### AI Per Component

```typescript
// Every component has AI context
{
  type: "Hero",
  ai: {
    description: "Hero section with title and CTA",
    canModify: ["title", "subtitle", "buttonText"],
    suggestions: ["Make exciting", "Add urgency"]
  }
}
// User clicks AI → Types "make it shorter" → AI returns props → Apply
```

### Module Components

```typescript
// Modules export editor components
export const studioComponents = {
  ProductCard: { type, fields, render, ai },
};
// Auto-discovered when module installed
```

### Mobile-First Responsive System (CRITICAL)

**All components are mobile-first responsive:**

```typescript
// Every visual prop uses ResponsiveValue<T>
type ResponsiveValue<T> = {
  mobile: T;      // REQUIRED - base value
  tablet?: T;     // 768px+ override
  desktop?: T;    // 1024px+ override
};

// Example
interface SectionProps {
  padding: ResponsiveValue<Spacing>;  // { mobile: '16px', desktop: '64px' }
  hideOn?: ('mobile' | 'tablet' | 'desktop')[];
}
```

**Breakpoints:**
- `mobile`: 0-767px (default)
- `tablet`: 768-1023px
- `desktop`: 1024px+

**CSS is mobile-first:**
```css
.component { font-size: 16px; }  /* Mobile base */
@media (min-width: 768px) { .component { font-size: 18px; } }
@media (min-width: 1024px) { .component { font-size: 24px; } }
```

### Component Strategy: Fresh Premium Components

**Decision (Feb 2, 2026):** Create ALL NEW components from scratch.

**Why NOT reuse existing Puck components:**
- Too basic (minimal props, no animations)
- No responsive support built-in
- No AI context
- Don't match Webflow/Wix quality

**New component location:**
```
src/components/studio/blocks/
├── layout/       → Section, Container, Columns, Spacer
├── typography/   → Heading, Text, RichText
├── media/        → Image, Video, Icon
├── interactive/  → Button, Link, Accordion
├── marketing/    → Hero, CTA, Testimonial
└── ...
```

---

### AI Website Designer — Converter Prop Mapping (CRITICAL REFERENCE)

**The prop name chain that MUST be aligned:**
```
Schema field name → AI outputs → Converter reads → Studio renders
```

**Key Mappings (as of Feb 2026 overhaul):**
| AI Output | Converter Reads | Studio Field | Notes |
|-----------|----------------|--------------|-------|
| `navItems` | `links \| navItems` | `links` | Engine outputs both |
| `copyrightText` | `copyrightText \| copyright` | `copyright` | Engine overrides with `copyrightText` |
| `headline \| title` | both → `title` | `title` | All components use `title` |
| `ctaText \| buttonText` | both → `buttonText` | `buttonText` | CTA component |
| `faqs \| items` | both → `items` | `items` | FAQ component |
| `price \| monthlyPrice` | both → `monthlyPrice` | `monthlyPrice` | Pricing component |
| `highlighted \| popular` | both → `popular` | `popular` | Pricing plan |
| `businessName \| companyName` | both → `companyName` | `companyName` | Footer |

**fixLink() Rules:**
- External URLs (http/https/mailto/tel): preserved unchanged
- Asset URLs (logoUrl, imageUrl, src, backgroundImage): NEVER processed
- Navigation links (href, link, ctaLink, buttonLink): validated against generated page slugs
- Placeholders (#, empty): resolved to best-matching route

**Priority Chain:** Blueprint > Design Inspiration > Quick Tokens > AI Freeform

---

### AI Website Designer — Design Token Flow (CRITICAL)

**Architecture (as of Feb 2026 theming overhaul):**
```
User Prompt → AI Architect → output.designSystem.colors
                                    ↓
Engine → passes to buildPagePrompt() → AI explicitly told to use these colors
                                    ↓
Front-end page.tsx → setDesignTokens(colors) → sets activeDesignTokens in converter.ts
                                    ↓
converter.ts → themePrimary(), isDarkTheme() → every component handler
                                    ↓
Studio Components → inline styles with correct theme colors
```

**Key Functions in converter.ts:**
| Function | Purpose |
|----------|---------|
| `setDesignTokens(tokens)` | Sets module-level `activeDesignTokens` — call before conversion |
| `themePrimary()` | Returns primary brand color (fallback: #3b82f6) |
| `themeAccent()` | Returns accent color (fallback: primary or #f59e0b) |
| `themeBackground()` | Returns site background (fallback: #ffffff) |
| `themeText()` | Returns text color (fallback: #111827) |
| `isDarkTheme()` | Luminance check on background: `(0.299*R + 0.587*G + 0.114*B) / 255 < 0.5` |

**Dark Mode Double Defense:**
1. **Converter** — `isDarkTheme()` sets dark-appropriate defaults for ALL component props
2. **AI Prompts** — `buildPagePrompt()` detects dark theme and injects explicit instructions
3. **Result**: Even if AI ignores prompts, converter catches it. Even if converter misses something, AI was told to set colors.

**Module Integration (enabled by default):**
- `engine.ts` DEFAULT_CONFIG: `enableModuleIntegration: true`
- Industry → Module mapping in `modules/types.ts` (barbershop→booking, restaurant→booking, etc.)
- Adds ~10-15s for 2 AI calls (analysis + configuration), well within 300s Vercel timeout

---

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

## Critical Implementation Protocols

### Git Workflow (ALWAYS FOLLOW)

**Commit and Push Protocol:**
1. After implementing any phase or feature, ALWAYS run TypeScript check:
   ```bash
   cd next-platform-dashboard
   npx tsc --noEmit --skipLibCheck
   ```

2. If **zero errors**, IMMEDIATELY commit and push:
   ```bash
   cd ..
   git add .
   git commit -m "feat: [descriptive message]"
   git push
   ```

3. **Never leave uncommitted working changes** - this prevents loss of work and maintains project continuity between sessions.

4. Update memory bank AFTER successful push to document what was built.

### Code Patterns (MUST FOLLOW)

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
// IMPORTANT: Webhooks and subdomain routes MUST use admin client (service role)
// because they have no auth cookies. createClient() will fail silently.
// src/app/api/modules/ecommerce/webhooks/payment/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
export async function POST(request: Request) {
  const supabase = createAdminClient() as any  // Bypasses RLS
  // Process webhook
  return Response.json({ success: true });
}
```

**Auth Client Pattern:**
```
Dashboard (logged-in user)   → createClient()     (cookie-auth, RLS enforced)
Subdomain / Public visitors  → createAdminClient() (service role, bypasses RLS)
Payment webhooks (S2S)       → createAdminClient() (no cookies available)
Form submissions             → createAdminClient() (anonymous visitors)
```

**Public vs Dashboard Action Files:**
```
ecommerce-actions.ts        → Dashboard CRUD (cookie-auth)
public-ecommerce-actions.ts → Storefront reads + checkout + order updates (admin client)
booking-actions.ts          → Dashboard CRUD (cookie-auth)
public-booking-actions.ts   → Storefront reads + appointment creation (admin client)
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
