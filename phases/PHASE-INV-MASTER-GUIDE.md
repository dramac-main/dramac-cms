# DRAMAC Invoicing & Financial Management Module — Complete Implementation Master Guide

**Document Type**: Master Implementation Guide (AI Agent Reference)  
**Created**: June 11, 2026  
**Platform**: DRAMAC CMS — Enterprise Module Marketplace  
**Production URL**: https://app.dramacagency.com  
**Module Prefix**: `mod_invmod01_`  
**Module Slug**: `invoicing`

---

## How to Use This Guide

This document is the **single source of truth** for building the DRAMAC Invoicing & Financial Management Module. It is designed to be consumed by AI agents across multiple sessions.

### Workflow Per Session

1. **Read this entire guide** to understand the full vision
2. **Read ALL memory bank files** (`/memory-bank/*.md`) to understand current platform state
3. **Pick the next unimplemented phase** from the phase list below
4. **Create a detailed phase document** (e.g., `PHASE-INV-01-DATABASE-FOUNDATION.md`) with step-by-step implementation plan
5. **Implement that phase completely** — all code, migrations, types, tests
6. **Verify**: Run `npx tsc --noEmit --skipLibCheck` with `NODE_OPTIONS="--max-old-space-size=8192"` — zero errors required
7. **Build**: Run `npx next build` — must succeed
8. **Commit**: `git add -A && git commit -m "feat: Phase INV-XX — [description]" && git push`
9. **Update memory bank**: Update `activeContext.md` and `progress.md` with what was actually built
10. **Do NOT modify this master guide** — it stays as the north star vision

### Critical Platform Rules (MUST Follow)

- **All prices in CENTS** (integers) — K250.00 = 25000
- **Supabase returns snake_case** — always use `mapRecord()`/`mapRecords()` from `@/lib/map-db-record`
- **Every server page needs auth guard**: `if (!user) redirect('/login')`
- **AI Zod schemas**: No `.int()`, `.min()`, `.max()` — Claude rejects these
- **Vercel function timeout**: `maxDuration = 60` on all AI API routes
- **Locale**: Zambia-first — `ZMW` currency, `K` symbol, `Africa/Lusaka` timezone, 16% VAT
- **Email sender**: `Dramac <noreply@app.dramacagency.com>` via Resend
- **Module DB prefix**: All tables MUST be `mod_invmod01_*`
- **No `dark:` Tailwind variants** in storefront/public components
- **Use semantic Tailwind**: `bg-card`, `text-foreground`, `bg-primary` — never hardcoded colors
- **`'use client'` components** must NOT contain inline `'use server'` annotations
- **Import server actions** as functions from separate files
- **Toast notifications**: Use `sonner` (not `useToast`)
- **Font inline styles**: Always use `fontFamily: value || undefined` (never empty string)

---

## Table of Contents

### Foundation

- **Phase INV-01**: Database Foundation, Module Registration & Type System
- **Phase INV-02**: Invoice CRUD, PDF Generation & Number Sequencing

### Core Invoicing

- **Phase INV-03**: Payment Recording, Partial Payments & Payment Methods
- **Phase INV-04**: Recurring Invoices, Auto-Billing & Schedules
- **Phase INV-05**: Credit Notes, Refunds & Adjustments

### Financial Management

- **Phase INV-06**: Expense Tracking, Categories & Receipt Upload
- **Phase INV-07**: Financial Dashboard, Reports & P&L Statements
- **Phase INV-08**: Tax Management, Multi-Currency & Compliance

### Client Experience

- **Phase INV-09**: Client Portal — Invoice Viewing, Online Payment & Statements
- **Phase INV-10**: Email Notifications, Reminders & Overdue Management

### Intelligence & Administration

- **Phase INV-11**: AI Financial Intelligence (Prediction, Insights, Smart Defaults)
- **Phase INV-12**: Super Admin Platform Controls (Revenue Monitoring, Health Metrics)
- **Phase INV-13**: Cross-Module Deep Integration (CRM, E-Commerce, Booking, Automation, Marketing)
- **Phase INV-14**: Vendor Management, Purchase Orders & Bills (Accounts Payable)

---

## Domain Research Summary

### Open-Source Invoicing Leaders Studied

This module's design draws from the industry's best open-source invoicing platforms:

| Platform                                      | Stars | Stack              | Key Patterns Adopted                                                                                                                                                                                                                                           |
| --------------------------------------------- | ----- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Invoice Ninja** (invoiceninja/invoiceninja) | 9.7k  | PHP/Laravel        | Invoice lifecycle states, quote-to-invoice conversion, recurring invoice engine, client portal invoice viewing, partial payments, credit system, payment gateway abstraction, vendor/PO system, tax configuration, custom numbering, bank transaction matching |
| **Bigcapital** (bigcapitalhq/bigcapital)      | 3.6k  | TypeScript/Node    | Double-entry accounting foundation, intelligent financial reporting, inventory tie-in, multi-currency with exchange rates, headless API design, journal entries, chart of accounts                                                                             |
| **Akaunting** (akaunting/akaunting)           | High  | PHP/Laravel        | Category-based expense tracking, bill management, bank reconciliation, financial dashboard widgets, tax reporting                                                                                                                                              |
| **IDURAR** (idurar/idurar-erp-crm)            | High  | Node/React         | MERN-stack invoicing patterns, quote-to-invoice pipeline, payment tracking, CRM-invoice integration                                                                                                                                                            |
| **Ever Gauzy** (ever-co/ever-gauzy)           | High  | TypeScript/Angular | Multi-tenant invoicing, time-to-invoice conversion, expense management, payment processing, estimate lifecycle                                                                                                                                                 |

### Core Domain Concepts Applied

From studying these platforms, the DRAMAC Invoicing module implements:

1. **Invoice Lifecycle**: Draft → Sent → Viewed → Partial Payment → Paid → Overdue → Void/Cancelled
2. **Numbering System**: Configurable prefix + year + sequential number (e.g., `INV-2026-0001`)
3. **Line Items**: Products/services with quantity, rate, tax, discount — independent item catalog
4. **Payment Recording**: Multiple payments per invoice, multiple methods, over/under payment handling
5. **Recurring Engine**: Template-based auto-generation on schedule (weekly/monthly/quarterly/yearly/custom)
6. **Credit Notes**: Full or partial credits that apply against future invoices
7. **Client Portal**: Clients view invoices, download PDFs, make payments, see statement of account
8. **Expense Tracking**: Categories, receipt uploads, billable expenses → convert to invoice line items
9. **Tax System**: Multiple tax rates, inclusive/exclusive, per-line or per-invoice, compound taxes
10. **Multi-Currency**: Exchange rates, currency per client, conversion at payment time
11. **Financial Reports**: P&L, accounts receivable aging, revenue by period, tax summary, expense reports
12. **Vendor/Bills (AP)**: Purchase orders → bills → payments to vendors (accounts payable)
13. **Automation Events**: Every state change fires events for the automation workflow engine
14. **AI Intelligence**: Payment prediction, smart payment reminders, expense categorization

### What This Module Does NOT Own (Boundaries)

| Already Owned By                  | What It Owns                                                  | Invoicing Module Boundary                                                                                                      |
| --------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **E-Commerce** (`mod_ecommod01_`) | Product order payments, order invoice receipts, order refunds | Invoicing does NOT replace order receipts. But E-Commerce orders CAN trigger standalone invoices (e.g., B2B wholesale billing) |
| **E-Commerce Quotes**             | Quote lifecycle, quote items, quote→order conversion          | Invoicing has its own Estimates/Quotes for service-based work. E-Commerce quotes can convert to invoices via integration       |
| **Paddle**                        | Platform subscription billing (agency pays for DRAMAC)        | Invoicing does NOT touch Paddle. The `/portal/invoices` route stays as Paddle billing                                          |
| **CRM** (`mod_crmmod01_`)         | Contact/company data, pipeline deals                          | Invoicing reads contacts/companies as invoice recipients. Deal-won can trigger invoice creation                                |
| **Booking**                       | Appointment scheduling, booking payments                      | Booking completions can generate invoices. Booking deposits flow through invoicing for tracking                                |

---

## Platform Architecture Context

### Multi-Tenant Hierarchy

```
Super Admin (Platform operator — DRAMAC)
    └── Agency (Organization that manages client businesses)
            ├── Team Members (roles: owner, admin, member)
            │   └── 21+ granular permissions across 5 categories
            ├── Clients (businesses the agency manages)
            │   └── Client Portal Access (12+ permission columns)
            ├── Sites (websites/storefronts per client)
            │   ├── Installed Modules (from marketplace)
            │   ├── Pages (DRAMAC Studio visual builder)
            │   ├── Blog, SEO, Forms, Media
            │   └── Storefront (customer auth, cart, orders)
            └── Module Subscriptions (agency pays via Paddle)
```

### Where Invoicing Lives in This Hierarchy

- **Invoicing data is SITE-SCOPED** — invoices belong to a site, not an agency
- **Agency manages invoicing** for their clients' sites (same as e-commerce, CRM, etc.)
- **Client portal** shows invoice data for their site(s) based on `can_view_invoices` and new `can_manage_invoices` permission
- **Super admin** sees platform-wide revenue metrics, invoice volume, payment health
- **Storefront customers** can receive invoices, view them via a secure link, and make payments
- **Public endpoints** handle payment completion callbacks and invoice PDF downloads via secure tokens

### Existing Module Dependencies

The Invoicing Module DEPENDS ON and INTEGRATES WITH:

| Module                              | How Invoicing Uses It                                                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CRM** (`mod_crmmod01_*`)          | Contacts & companies are invoice recipients. Contact address/billing info populates invoices. Deal pipeline "won" triggers invoice creation. Contact activity log shows invoice history.                                             |
| **Automation** (`automation_*`)     | Workflow engine processes overdue reminders, payment confirmation emails, recurring invoice generation. Invoice events trigger workflows. Invoice actions available in workflow builder.                                             |
| **E-Commerce** (`mod_ecommod01_*`)  | Wholesale/B2B orders can generate standalone invoices. E-Commerce quotes can convert to invoices. Shared payment infrastructure patterns (proof uploads, manual payments). Product catalog can be referenced for invoice line items. |
| **Booking** (`mod_bookmod01_*`)     | Completed bookings can auto-generate invoices. Deposit tracking flows through invoicing. Service items from booking feed into invoice line items.                                                                                    |
| **Marketing** (`mod_mktmod01_*`)    | Payment confirmation emails leverage marketing templates. Overdue reminder campaigns use marketing sending infrastructure. Revenue data enriches marketing segmentation.                                                             |
| **Live Chat** (`mod_chat_*`)        | AI responder can reference invoice status ("Your invoice #INV-2026-0042 is due on..."). Chat events can trigger invoice actions.                                                                                                     |
| **Email System** (`src/lib/email/`) | Reuses Resend client, branding system, template rendering for invoice emails, payment receipts, and overdue reminders.                                                                                                               |

### Tech Stack Reference

- **Framework**: Next.js 16.1.1, React 19, TypeScript strict
- **Database**: Supabase PostgreSQL with RLS
- **UI**: Radix UI + Tailwind CSS 4 + Framer Motion
- **State**: Zustand + TanStack Query + React Hook Form + Zod
- **Email Provider**: Resend (REST API)
- **AI**: Claude Sonnet 4.6 (primary), Haiku 4.5 (fast tasks)
- **Charts**: Recharts
- **Rich Text**: TipTap
- **Billing**: Paddle (Merchant of Record — for DRAMAC platform billing only)
- **Auth**: Supabase Auth (dashboard/portal) + bcrypt custom (storefront)
- **PDF**: React-based PDF rendering (browser print-to-PDF pattern from E-Commerce `invoice-template.tsx`)

---

## Relationship: Invoicing Module vs E-Commerce Module

### They Are DIFFERENT Layers

```
┌──────────────────────────────────────────────────────────┐
│  INVOICING MODULE (Financial Management Layer)            │
│                                                           │
│  "Create, send, track, and collect payment on invoices    │
│   for ANY service or product — independent of orders"     │
│                                                           │
│  • Standalone invoice creation (not order-dependent)      │
│  • Recurring invoice engine                               │
│  • Expense tracking & categorization                      │
│  • Credit notes & refund management                       │
│  • Financial dashboard & P&L reports                      │
│  • Multi-currency with exchange rates                     │
│  • Tax management & compliance                            │
│  • Client payment portal (invoice-specific)               │
│  • Vendor bills & accounts payable                        │
│  • AI financial intelligence                              │
│                                                           │
│  PRODUCES: accounting.* events (fires the placeholder     │
│            events already defined in event-types.ts)       │
│  CONSUMES: Automation workflows for reminders, recurring  │
└────────────────────┬─────────────────────────────────────┘
                     │ INTEGRATES WITH (does not replace)
                     ▼
┌──────────────────────────────────────────────────────────┐
│  E-COMMERCE MODULE (Product Sales Layer)                  │
│                                                           │
│  "Sell products online through a storefront with          │
│   cart, checkout, and order management"                   │
│                                                           │
│  • Product catalog & inventory                            │
│  • Shopping cart & checkout flow                          │
│  • Order management & fulfillment                         │
│  • Order-attached invoice receipts (print view)           │
│  • Payment proof uploads                                  │
│  • E-Commerce quotes → orders                             │
│  • Storefront customer accounts                           │
│                                                           │
│  PRODUCES: ecommerce.* events                             │
│  CAN TRIGGER: Invoice creation for B2B/wholesale orders   │
└──────────────────────────────────────────────────────────┘
```

### Example: Service-Based Business Flow

1. **CRM**: Agency creates contact "Acme Corp" and tracks deal in pipeline
2. **Booking**: Acme Corp books a consulting session
3. **Invoicing**: After session, agent creates invoice for consulting fees → sends to Acme Corp
4. **Client Portal**: Acme Corp views invoice, downloads PDF, makes payment
5. **Invoicing**: Payment recorded, receipt sent, revenue reflected in dashboard
6. **Automation**: If payment is late, overdue workflow sends reminders at day 7, 14, 30
7. **Marketing**: Paid clients get added to "Active Clients" segment for upsell campaigns

### Example: B2B Wholesale Flow

1. **E-Commerce**: Wholesale order placed for 500 units
2. **Invoicing**: `ecommerce.order.created` event triggers → creates standalone invoice with net-30 terms
3. **Invoicing**: Invoice sent with payment terms, Acme Corp pays via bank transfer
4. **Invoicing**: Agent records manual payment → marks invoice paid
5. **E-Commerce**: Order status updated to payment-confirmed → fulfillment begins

---

## Access Control Design

### Agency Dashboard (`/dashboard/sites/[siteId]/invoicing/`)

**Who**: Agency owners, admins, members with `manage_invoicing` permission  
**What they can do**:

- Full invoice management (create, edit, send, void, clone, convert from quote)
- Payment recording (manual payments, payment method tracking)
- Recurring invoice setup and management
- Credit note creation and application
- Expense tracking (create, categorize, attach receipts, mark billable)
- Client/contact invoice history and statements
- Financial dashboard (revenue, outstanding, overdue, cash flow)
- Financial reports (P&L, AR aging, tax summary, expense report)
- Tax rate configuration and management
- Invoice settings (numbering, terms, late fees, branding)
- Vendor and purchase order management
- Item/service catalog for quick invoice line items

**Routes**:

```
/dashboard/sites/[siteId]/invoicing/                     — Financial dashboard (overview)
/dashboard/sites/[siteId]/invoicing/invoices/            — Invoice list
/dashboard/sites/[siteId]/invoicing/invoices/new/        — Create invoice
/dashboard/sites/[siteId]/invoicing/invoices/[id]/       — Invoice detail (view + edit + payments)
/dashboard/sites/[siteId]/invoicing/invoices/[id]/pdf/   — Invoice PDF preview (print view)
/dashboard/sites/[siteId]/invoicing/recurring/           — Recurring invoice list
/dashboard/sites/[siteId]/invoicing/recurring/new/       — Create recurring template
/dashboard/sites/[siteId]/invoicing/recurring/[id]/      — Recurring template detail
/dashboard/sites/[siteId]/invoicing/payments/            — Payment list (all payments across invoices)
/dashboard/sites/[siteId]/invoicing/credits/             — Credit note list
/dashboard/sites/[siteId]/invoicing/credits/new/         — Create credit note
/dashboard/sites/[siteId]/invoicing/credits/[id]/        — Credit note detail
/dashboard/sites/[siteId]/invoicing/expenses/            — Expense list
/dashboard/sites/[siteId]/invoicing/expenses/new/        — Create expense
/dashboard/sites/[siteId]/invoicing/expenses/[id]/       — Expense detail
/dashboard/sites/[siteId]/invoicing/items/               — Item/service catalog
/dashboard/sites/[siteId]/invoicing/vendors/             — Vendor list
/dashboard/sites/[siteId]/invoicing/vendors/[id]/        — Vendor detail
/dashboard/sites/[siteId]/invoicing/bills/               — Bills payable list
/dashboard/sites/[siteId]/invoicing/bills/new/           — Create bill
/dashboard/sites/[siteId]/invoicing/bills/[id]/          — Bill detail
/dashboard/sites/[siteId]/invoicing/reports/             — Financial reports hub
/dashboard/sites/[siteId]/invoicing/reports/pnl/         — Profit & Loss report
/dashboard/sites/[siteId]/invoicing/reports/aging/       — Accounts receivable aging
/dashboard/sites/[siteId]/invoicing/reports/tax/         — Tax summary report
/dashboard/sites/[siteId]/invoicing/reports/expenses/    — Expense report
/dashboard/sites/[siteId]/invoicing/settings/            — Invoicing settings
```

### Client Portal (`/portal/sites/[siteId]/invoicing/`)

**Who**: Clients with `can_manage_invoices` permission (new column, separate from existing `can_view_invoices`)  
**What they can do** (configurable per client):

- View invoices addressed to their contacts/company
- Download invoice PDFs
- View payment history and outstanding balance
- View and download statements of account
- View credit notes applied to their account
- Create simple invoices (if permitted — for agencies that delegate invoicing to clients)
- View expense reports shared with them

**Routes**:

```
/portal/sites/[siteId]/invoicing/                        — Invoice overview (outstanding, recent)
/portal/sites/[siteId]/invoicing/invoices/               — Invoice list
/portal/sites/[siteId]/invoicing/invoices/[id]/          — Invoice detail + payment action
/portal/sites/[siteId]/invoicing/payments/               — Payment history
/portal/sites/[siteId]/invoicing/credits/                — Credit notes
/portal/sites/[siteId]/invoicing/statements/             — Statement of account
```

### Super Admin (`/admin/invoicing/`)

**Who**: Super admin only (`profiles.role === 'super_admin'`)  
**What they can do**:

- Platform-wide invoice volume and revenue dashboard
- Per-agency invoice health (overdue rates, payment collection rates)
- Payment method distribution across agencies
- Revenue trends and forecasting
- Invoice abuse detection (fake invoices, suspicious patterns)
- Global tax configuration and compliance monitoring

**Routes**:

```
/admin/invoicing/                                        — Platform invoicing health dashboard
/admin/invoicing/revenue/                                — Revenue analytics across agencies
/admin/invoicing/health/                                 — Collection rates, overdue monitoring
/admin/invoicing/compliance/                             — Tax compliance overview
```

### Public/Storefront Endpoints

**What external users access**:

- Secure invoice view link (`/api/invoicing/view/[token]`) — client views invoice without login
- Online payment page (`/api/invoicing/pay/[token]`) — client makes payment via supported gateway
- Payment confirmation callback (`/api/invoicing/webhooks/[provider]`) — payment gateway webhooks
- PDF download (`/api/invoicing/pdf/[token]`) — download invoice PDF via secure token
- Receipt page (`/api/invoicing/receipt/[token]`) — payment receipt view

---

## Existing Code Integration Points

### Files That Will Be MODIFIED (Not Replaced)

These existing files get NEW entries added. No existing functionality is removed or changed.

#### 1. Automation Event Registry

**File**: `src/modules/automation/lib/event-types.ts`  
**Change**: Activate the `accounting.*` event category (currently commented out as `EM-55 Future`). Add all invoicing event types.  
**Risk**: Zero — activating placeholder + additive entries

#### 2. Automation Action Types

**File**: `src/modules/automation/lib/action-types.ts`  
**Change**: Add `invoicing` category with 10+ new action types  
**Risk**: Zero — additive array entries

#### 3. Automation System Templates

**File**: `src/modules/automation/lib/system-templates.ts`  
**Change**: Add 10+ pre-built invoicing workflow templates (overdue reminders, payment confirmation, recurring generation, etc.)  
**Risk**: Zero — additive array entries

#### 4. Email Types

**File**: `src/lib/email/email-types.ts`  
**Change**: Add invoicing email types (invoice_sent, payment_received, overdue_reminder, credit_note, statement, etc.)  
**Risk**: Zero — additive type union + interface additions

#### 5. Email Templates

**File**: `src/lib/email/templates.ts`  
**Change**: Add invoicing email template renderers  
**Risk**: Zero — additive registry entries

#### 6. Dashboard Navigation

**File**: `src/config/navigation.ts`  
**Change**: Add "Invoicing" nav section under sites with icon `Receipt` (from Lucide)  
**Risk**: Zero — additive nav items

#### 7. Portal Navigation

**File**: `src/config/portal-navigation.ts`  
**Change**: Add invoicing portal nav items, gated by `hasModule("invoicing") && permissions.canManageInvoices`. Note: `canViewInvoices` already exists and points to Paddle billing — the new permission is `canManageInvoices`.  
**Risk**: Zero — follows exact same pattern as other modules

#### 8. Roles & Permissions

**File**: `src/types/roles.ts`  
**Change**: Add `manage_invoicing` permission  
**Risk**: Zero — additive permission entry

#### 9. Client Permissions

**DB Migration**: Add `can_manage_invoices` boolean column to `clients` table  
**Risk**: Zero — nullable column with default false

#### 10. Module Catalog

**File**: `src/lib/modules/module-catalog.ts`  
**Change**: Add invoicing module definition with full catalog entry  
**Risk**: Zero — additive catalog entry

#### 11. Core Module Installation

**File**: `src/lib/actions/sites.ts`  
**Change**: Add `"invoicing"` to `CORE_MODULE_SLUGS` array — invoicing auto-installs for all new sites  
**Risk**: Zero — additive array entry

#### 12. Admin Analytics Stubs

**File**: `src/lib/actions/admin-analytics.ts`  
**Change**: Implement the stub functions `getInvoiceMetrics()` and `getBillingActivity()` which currently return empty data  
**Risk**: Low — replacing stub implementations with real queries

#### 13. Admin Analytics Types

**File**: `src/types/admin-analytics.ts`  
**Change**: Flesh out `InvoiceMetrics` and `BillingActivityItem` types with real fields from the new tables  
**Risk**: Low — expanding existing interfaces

#### 14. CRM Contact Detail

**File**: CRM contact detail page/components  
**Change**: Add "Invoices" tab showing invoices for this contact  
**Risk**: Low — additive tab component

#### 15. Site Detail Page

**File**: `src/app/(dashboard)/dashboard/sites/[siteId]/page.tsx`  
**Change**: Add `hasModule("invoicing")` check, TabsTrigger, and TabsContent for invoicing overview  
**Risk**: Zero — follows exact pattern of other module tabs

#### 16. Site Modules Tab

**File**: Site modules tab component  
**Change**: Add `"invoicing"` to Open button whitelist  
**Risk**: Zero — additive string entry

#### 17. AI Website Designer

**Files**: `website-designer/modules/types.ts`, `analyzer.ts`, `configurator`, `default-configs.ts`  
**Change**: Add `"invoicing"` to ModuleType union, Zod enum, configurator switch, and default config  
**Risk**: Zero — additive entries following exact pattern

#### 18. Auto-Install Mappings

**Files**: `FEATURE_MODULE_MAP` and `COMPONENT_MODULE_MAP`  
**Change**: Add invoicing feature/component mappings  
**Risk**: Zero — additive map entries

#### 19. Industry Mapping

**File**: Industry module mapping  
**Change**: Add `"invoicing"` to recommended modules for relevant industries  
**Risk**: Zero — additive array entries

### Files That Will Be CREATED (New)

All new invoicing module code lives in these locations:

```
src/modules/invoicing/
├── types/
│   ├── invoice-types.ts                — Invoice, line item, invoice settings types
│   ├── payment-types.ts                — Payment, payment method, refund types
│   ├── recurring-types.ts              — Recurring invoice template types
│   ├── credit-types.ts                 — Credit note types
│   ├── expense-types.ts                — Expense, category, receipt types
│   ├── vendor-types.ts                 — Vendor, bill, purchase order types
│   ├── report-types.ts                 — Financial report types
│   └── tax-types.ts                    — Tax rate, tax group types
├── actions/
│   ├── invoice-actions.ts              — Invoice CRUD + send/void/clone
│   ├── payment-actions.ts              — Payment recording + refunds
│   ├── recurring-actions.ts            — Recurring invoice CRUD + generation
│   ├── credit-actions.ts              — Credit note CRUD + application
│   ├── expense-actions.ts             — Expense CRUD + receipt upload
│   ├── item-actions.ts                — Item/service catalog CRUD
│   ├── vendor-actions.ts             — Vendor + bill + PO CRUD
│   ├── report-actions.ts             — Financial report generation
│   ├── tax-actions.ts                — Tax rate management
│   ├── settings-actions.ts           — Invoicing settings management
│   └── statement-actions.ts          — Client statement generation
├── services/
│   ├── invoice-number-service.ts      — Sequential number generation with prefix
│   ├── invoice-pdf-service.ts         — PDF rendering using React template
│   ├── payment-processing-service.ts  — Payment recording + balance calculation
│   ├── recurring-engine-service.ts    — Cron-based recurring invoice generation
│   ├── overdue-service.ts            — Overdue detection + late fee calculation
│   ├── tax-calculation-service.ts    — Tax computation (inclusive/exclusive, compound)
│   ├── currency-service.ts           — Multi-currency conversion + exchange rates
│   ├── ai-finance-service.ts         — AI payment prediction + insights
│   └── statement-service.ts          — Statement of account generation
├── components/
│   ├── invoices/
│   │   ├── invoice-list.tsx
│   │   ├── invoice-detail.tsx
│   │   ├── invoice-form.tsx            — Invoice creation/edit with line items
│   │   ├── invoice-line-items.tsx      — Tabular line item editor
│   │   ├── invoice-preview.tsx         — Live PDF preview
│   │   ├── invoice-pdf-template.tsx    — Print-ready PDF template
│   │   ├── invoice-actions-toolbar.tsx — Send, void, clone, convert actions
│   │   ├── invoice-activity-log.tsx    — Timeline of invoice events
│   │   ├── invoice-status-badge.tsx    — Color-coded status indicator
│   │   └── invoice-filters.tsx         — Filter bar (status, date, client, amount)
│   ├── payments/
│   │   ├── payment-list.tsx
│   │   ├── payment-form.tsx            — Record payment dialog
│   │   ├── payment-detail.tsx
│   │   └── payment-method-icon.tsx     — Visual payment method indicator
│   ├── recurring/
│   │   ├── recurring-list.tsx
│   │   ├── recurring-form.tsx
│   │   ├── recurring-detail.tsx
│   │   └── recurring-schedule-preview.tsx — Shows next N generation dates
│   ├── credits/
│   │   ├── credit-list.tsx
│   │   ├── credit-form.tsx
│   │   ├── credit-detail.tsx
│   │   └── credit-apply-dialog.tsx     — Apply credit to invoice
│   ├── expenses/
│   │   ├── expense-list.tsx
│   │   ├── expense-form.tsx
│   │   ├── expense-detail.tsx
│   │   ├── expense-category-manager.tsx
│   │   └── receipt-upload.tsx          — Receipt image upload with OCR hint
│   ├── items/
│   │   ├── item-list.tsx
│   │   └── item-form.tsx               — Reusable item/service catalog entry
│   ├── vendors/
│   │   ├── vendor-list.tsx
│   │   ├── vendor-form.tsx
│   │   ├── vendor-detail.tsx
│   │   ├── bill-list.tsx
│   │   ├── bill-form.tsx
│   │   └── bill-detail.tsx
│   ├── reports/
│   │   ├── report-hub.tsx              — Report selection dashboard
│   │   ├── pnl-report.tsx             — Profit & Loss statement
│   │   ├── ar-aging-report.tsx        — Accounts receivable aging
│   │   ├── tax-summary-report.tsx     — Tax collected/owed summary
│   │   ├── expense-report.tsx         — Expense breakdown report
│   │   └── revenue-chart.tsx          — Revenue trend visualization
│   ├── dashboard/
│   │   ├── finance-dashboard.tsx       — Main invoicing dashboard
│   │   ├── revenue-widget.tsx         — Revenue summary card
│   │   ├── outstanding-widget.tsx     — Outstanding invoices card
│   │   ├── overdue-widget.tsx         — Overdue invoices card
│   │   ├── recent-invoices-widget.tsx — Recent invoice activity
│   │   ├── cash-flow-chart.tsx        — Cash flow visualization
│   │   └── payment-method-chart.tsx   — Payment method distribution
│   ├── shared/
│   │   ├── contact-invoice-picker.tsx  — Select CRM contact as recipient
│   │   ├── item-picker.tsx            — Quick-add items from catalog
│   │   ├── tax-rate-selector.tsx      — Tax rate picker
│   │   ├── currency-selector.tsx      — Currency picker with exchange rate
│   │   ├── amount-display.tsx         — Formatted amount with currency
│   │   └── date-range-filter.tsx      — Reusable date range picker
│   └── portal/
│       ├── portal-invoice-list.tsx     — Client portal invoice list
│       ├── portal-invoice-detail.tsx   — Client portal invoice view
│       ├── portal-payment-history.tsx  — Client portal payment history
│       └── portal-statement.tsx        — Client portal statement view
└── lib/
    ├── invoicing-constants.ts          — Module constants, defaults, statuses
    ├── invoicing-utils.ts             — Shared utilities (amount formatting, tax calc helpers)
    ├── number-formats.ts              — Invoice/credit/bill number formatting
    └── currency-rates.ts              — Exchange rate provider helpers
```

**Dashboard Pages** (new):

```
src/app/(dashboard)/dashboard/sites/[siteId]/invoicing/
├── page.tsx                            — Financial dashboard (overview)
├── invoices/
│   ├── page.tsx                        — Invoice list
│   ├── new/page.tsx                    — Create invoice
│   └── [invoiceId]/
│       ├── page.tsx                    — Invoice detail
│       └── pdf/page.tsx               — PDF preview (print view)
├── recurring/
│   ├── page.tsx                        — Recurring invoice list
│   ├── new/page.tsx                    — Create recurring template
│   └── [recurringId]/page.tsx          — Recurring template detail
├── payments/page.tsx                   — Payment list
├── credits/
│   ├── page.tsx                        — Credit note list
│   ├── new/page.tsx                    — Create credit note
│   └── [creditId]/page.tsx            — Credit note detail
├── expenses/
│   ├── page.tsx                        — Expense list
│   ├── new/page.tsx                    — Create expense
│   └── [expenseId]/page.tsx           — Expense detail
├── items/page.tsx                      — Item/service catalog
├── vendors/
│   ├── page.tsx                        — Vendor list
│   └── [vendorId]/page.tsx            — Vendor detail
├── bills/
│   ├── page.tsx                        — Bills list
│   ├── new/page.tsx                    — Create bill
│   └── [billId]/page.tsx             — Bill detail
├── reports/
│   ├── page.tsx                        — Reports hub
│   ├── pnl/page.tsx                   — P&L report
│   ├── aging/page.tsx                 — AR aging report
│   ├── tax/page.tsx                   — Tax summary report
│   └── expenses/page.tsx             — Expense report
└── settings/page.tsx                   — Invoicing settings
```

**Portal Pages** (new):

```
src/app/portal/sites/[siteId]/invoicing/
├── page.tsx                            — Invoice overview
├── invoices/
│   ├── page.tsx                        — Invoice list
│   └── [invoiceId]/page.tsx           — Invoice detail + pay action
├── payments/page.tsx                   — Payment history
├── credits/page.tsx                    — Credit notes
└── statements/page.tsx                — Statement of account
```

**Admin Pages** (new):

```
src/app/(dashboard)/admin/invoicing/
├── page.tsx                            — Platform invoicing health dashboard
├── revenue/page.tsx                    — Revenue analytics across agencies
├── health/page.tsx                     — Collection rates, overdue monitoring
└── compliance/page.tsx                — Tax compliance overview
```

**API Routes** (new):

```
src/app/api/invoicing/
├── view/[token]/route.ts               — Secure invoice view (no auth required)
├── pay/[token]/route.ts                — Online payment page
├── pdf/[token]/route.ts                — PDF download via secure token
├── receipt/[token]/route.ts            — Payment receipt view
├── webhooks/
│   └── [provider]/route.ts            — Payment gateway callbacks
├── recurring/process/route.ts          — Cron endpoint for recurring invoice generation
└── overdue/check/route.ts             — Cron endpoint for overdue detection
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASE DEFINITIONS

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

---

## Phase INV-01: Database Foundation, Module Registration & Type System

### Purpose

Establish all core database tables, RLS policies, TypeScript types, module registration, navigation wiring, and permission system. This phase creates the complete schema skeleton that all subsequent phases build on. **No UI components are built in this phase** — it is purely infrastructure.

### Database Tables (18 tables, all prefixed `mod_invmod01_`)

#### Table 1: `mod_invmod01_settings`

Per-site invoicing configuration. One row per site. Auto-seeded when module is installed.

| Column                        | Type        | Constraints                                     | Description                                                               |
| ----------------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| `id`                          | uuid        | PK, default gen_random_uuid()                   | Settings ID                                                               |
| `site_id`                     | uuid        | FK sites.id, UNIQUE, NOT NULL                   | One settings row per site                                                 |
| `invoice_prefix`              | text        | DEFAULT 'INV'                                   | Invoice number prefix                                                     |
| `invoice_next_number`         | integer     | DEFAULT 1                                       | Next sequential invoice number                                            |
| `invoice_number_format`       | text        | DEFAULT '{prefix}-{year}-{number}'              | Format template with tokens                                               |
| `invoice_padding`             | integer     | DEFAULT 4                                       | Zero-pad length (4 = 0001)                                                |
| `credit_note_prefix`          | text        | DEFAULT 'CN'                                    | Credit note number prefix                                                 |
| `credit_note_next_number`     | integer     | DEFAULT 1                                       | Next sequential credit note number                                        |
| `bill_prefix`                 | text        | DEFAULT 'BILL'                                  | Bill number prefix                                                        |
| `bill_next_number`            | integer     | DEFAULT 1                                       | Next sequential bill number                                               |
| `po_prefix`                   | text        | DEFAULT 'PO'                                    | Purchase order number prefix                                              |
| `po_next_number`              | integer     | DEFAULT 1                                       | Next sequential PO number                                                 |
| `default_currency`            | text        | DEFAULT 'ZMW'                                   | Default currency code (ISO 4217)                                          |
| `default_payment_terms_days`  | integer     | DEFAULT 30                                      | Default payment terms in days                                             |
| `default_payment_terms_label` | text        | DEFAULT 'Net 30'                                | Display label for default terms                                           |
| `default_tax_rate_id`         | uuid        | FK mod_invmod01_tax_rates.id                    | Default tax rate applied to new invoices                                  |
| `default_notes`               | text        |                                                 | Default notes appended to invoices                                        |
| `default_terms`               | text        |                                                 | Default terms & conditions text                                           |
| `late_fee_enabled`            | boolean     | DEFAULT false                                   | Enable automatic late fee charges                                         |
| `late_fee_type`               | text        | DEFAULT 'percentage', CHECK (percentage, fixed) | Late fee calculation method                                               |
| `late_fee_amount`             | integer     | DEFAULT 200                                     | Late fee amount — percentage in basis points (200 = 2%) or fixed in CENTS |
| `late_fee_grace_days`         | integer     | DEFAULT 7                                       | Days after due date before late fee applies                               |
| `overdue_reminder_enabled`    | boolean     | DEFAULT true                                    | Send automatic overdue reminders                                          |
| `overdue_reminder_schedule`   | jsonb       | DEFAULT '[7, 14, 30]'                           | Days after due date to send reminders (array of integers)                 |
| `brand_logo_url`              | text        |                                                 | Logo URL for invoice PDF header                                           |
| `brand_color`                 | text        | DEFAULT '#000000'                               | Primary color for invoice PDF accent                                      |
| `company_name`                | text        |                                                 | Business name for invoice header                                          |
| `company_address`             | text        |                                                 | Business address for invoice header                                       |
| `company_phone`               | text        |                                                 | Business phone for invoice header                                         |
| `company_email`               | text        |                                                 | Business email for invoice header                                         |
| `company_website`             | text        |                                                 | Business website for invoice header                                       |
| `company_tax_id`              | text        |                                                 | Tax registration number (e.g., TPIN in Zambia)                            |
| `online_payment_enabled`      | boolean     | DEFAULT false                                   | Allow clients to pay invoices online via secure link                      |
| `payment_instructions`        | text        |                                                 | Bank transfer / mobile money instructions shown on invoices               |
| `timezone`                    | text        | DEFAULT 'Africa/Lusaka'                         | For scheduling and due date calculations                                  |
| `metadata`                    | jsonb       | DEFAULT '{}'                                    | Extensible metadata                                                       |
| `created_at`                  | timestamptz | DEFAULT now()                                   |                                                                           |
| `updated_at`                  | timestamptz | DEFAULT now()                                   |                                                                           |

**Indexes**: `site_id` (UNIQUE)

#### Table 2: `mod_invmod01_tax_rates`

Tax rate definitions. Supports multiple tax rates per site, inclusive/exclusive, compound taxes.

| Column        | Type         | Constraints                                       | Description                                                  |
| ------------- | ------------ | ------------------------------------------------- | ------------------------------------------------------------ |
| `id`          | uuid         | PK, default gen_random_uuid()                     | Tax rate ID                                                  |
| `site_id`     | uuid         | FK sites.id, NOT NULL                             | Site scope                                                   |
| `name`        | text         | NOT NULL                                          | Tax name (e.g., "VAT", "Sales Tax", "GST")                   |
| `rate`        | numeric(8,4) | NOT NULL                                          | Tax rate as decimal (16.0000 = 16%)                          |
| `type`        | text         | DEFAULT 'exclusive', CHECK (inclusive, exclusive) | Whether tax is included in or added to prices                |
| `is_compound` | boolean      | DEFAULT false                                     | If true, this tax is calculated on subtotal + previous taxes |
| `is_default`  | boolean      | DEFAULT false                                     | Default tax rate for new invoices                            |
| `description` | text         |                                                   | Human-readable description                                   |
| `is_active`   | boolean      | DEFAULT true                                      | Available for selection                                      |
| `sort_order`  | integer      | DEFAULT 0                                         | Display order                                                |
| `created_at`  | timestamptz  | DEFAULT now()                                     |                                                              |
| `updated_at`  | timestamptz  | DEFAULT now()                                     |                                                              |

**Indexes**: `site_id`, `is_active`, `is_default`

#### Table 3: `mod_invmod01_items`

Reusable product/service catalog for quick invoice line item addition.

| Column        | Type        | Constraints                                          | Description                                                           |
| ------------- | ----------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| `id`          | uuid        | PK, default gen_random_uuid()                        | Item ID                                                               |
| `site_id`     | uuid        | FK sites.id, NOT NULL                                | Site scope                                                            |
| `name`        | text        | NOT NULL                                             | Item name (e.g., "Web Development - Hourly", "Logo Design Package")   |
| `description` | text        |                                                      | Item description (appears on invoice)                                 |
| `type`        | text        | DEFAULT 'service', CHECK (service, product, expense) | Item type                                                             |
| `unit_price`  | integer     | NOT NULL                                             | Price in CENTS (e.g., 25000 = K250.00)                                |
| `unit`        | text        |                                                      | Unit of measurement (e.g., "hour", "unit", "project", "day", "month") |
| `tax_rate_id` | uuid        | FK mod_invmod01_tax_rates.id                         | Default tax rate for this item                                        |
| `sku`         | text        |                                                      | Stock keeping unit / item code                                        |
| `category`    | text        |                                                      | Item category for organization                                        |
| `is_active`   | boolean     | DEFAULT true                                         | Available for selection                                               |
| `sort_order`  | integer     | DEFAULT 0                                            | Display order                                                         |
| `metadata`    | jsonb       | DEFAULT '{}'                                         | Extensible metadata                                                   |
| `created_at`  | timestamptz | DEFAULT now()                                        |                                                                       |
| `updated_at`  | timestamptz | DEFAULT now()                                        |                                                                       |

**Indexes**: `site_id`, `type`, `is_active`, `sku`  
**UNIQUE**: `(site_id, sku)` WHERE `sku IS NOT NULL` — SKUs must be unique within a site when provided

#### Table 4: `mod_invmod01_invoices`

The core invoice entity. Supports the full lifecycle: Draft → Sent → Viewed → Partial → Paid → Overdue → Void.

| Column                   | Type          | Constraints                                                                                     | Description                                                                 |
| ------------------------ | ------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`                     | uuid          | PK, default gen_random_uuid()                                                                   | Invoice ID                                                                  |
| `site_id`                | uuid          | FK sites.id, NOT NULL                                                                           | Site scope                                                                  |
| `invoice_number`         | text          | NOT NULL                                                                                        | Generated invoice number (e.g., "INV-2026-0001")                            |
| `status`                 | text          | NOT NULL, DEFAULT 'draft', CHECK (draft, sent, viewed, partial, paid, overdue, void, cancelled) | Invoice lifecycle status                                                    |
| `contact_id`             | uuid          |                                                                                                 | FK to CRM contact (mod_crmmod01_contacts.id) — invoice recipient            |
| `company_id`             | uuid          |                                                                                                 | FK to CRM company (mod_crmmod01_companies.id) — recipient company           |
| `storefront_customer_id` | uuid          |                                                                                                 | FK to storefront_customers.id — for B2C invoices                            |
| `client_name`            | text          | NOT NULL                                                                                        | Recipient name (denormalized for PDF/display — either from CRM or manual)   |
| `client_email`           | text          |                                                                                                 | Recipient email for sending                                                 |
| `client_phone`           | text          |                                                                                                 | Recipient phone                                                             |
| `client_address`         | text          |                                                                                                 | Recipient address (billing)                                                 |
| `client_tax_id`          | text          |                                                                                                 | Recipient tax registration number                                           |
| `currency`               | text          | DEFAULT 'ZMW'                                                                                   | Invoice currency (ISO 4217)                                                 |
| `exchange_rate`          | numeric(18,8) | DEFAULT 1.00000000                                                                              | Exchange rate to base currency at time of invoice                           |
| `issue_date`             | date          | NOT NULL, DEFAULT CURRENT_DATE                                                                  | Date of issue                                                               |
| `due_date`               | date          | NOT NULL                                                                                        | Payment due date                                                            |
| `paid_date`              | date          |                                                                                                 | Date fully paid                                                             |
| `payment_terms`          | text          |                                                                                                 | Payment terms label (e.g., "Net 30", "Due on Receipt")                      |
| `subtotal`               | integer       | NOT NULL, DEFAULT 0                                                                             | Sum of line item subtotals in CENTS                                         |
| `discount_type`          | text          | CHECK (percentage, fixed)                                                                       | Invoice-level discount type                                                 |
| `discount_value`         | integer       | DEFAULT 0                                                                                       | Discount amount — percentage in basis points (1000 = 10%) or fixed in CENTS |
| `discount_amount`        | integer       | DEFAULT 0                                                                                       | Calculated discount in CENTS                                                |
| `tax_amount`             | integer       | DEFAULT 0                                                                                       | Total tax in CENTS                                                          |
| `total`                  | integer       | NOT NULL, DEFAULT 0                                                                             | Grand total in CENTS (subtotal - discount + tax)                            |
| `amount_paid`            | integer       | DEFAULT 0                                                                                       | Total amount paid in CENTS                                                  |
| `amount_due`             | integer       | NOT NULL, DEFAULT 0                                                                             | Remaining balance in CENTS (total - amount_paid - credits_applied)          |
| `credits_applied`        | integer       | DEFAULT 0                                                                                       | Total credit notes applied in CENTS                                         |
| `deposit_amount`         | integer       | DEFAULT 0                                                                                       | Required deposit amount in CENTS (0 = no deposit required)                  |
| `deposit_paid`           | boolean       | DEFAULT false                                                                                   | Whether deposit has been received                                           |
| `notes`                  | text          |                                                                                                 | Notes to client (appear on invoice)                                         |
| `terms`                  | text          |                                                                                                 | Terms & conditions (appear on invoice)                                      |
| `internal_notes`         | text          |                                                                                                 | Internal agency notes (NOT visible to client)                               |
| `footer`                 | text          |                                                                                                 | Footer text for PDF                                                         |
| `reference`              | text          |                                                                                                 | External reference number (e.g., PO number from client)                     |
| `recurring_invoice_id`   | uuid          | FK mod_invmod01_recurring_invoices.id                                                           | If generated from recurring template                                        |
| `source_type`            | text          | CHECK (manual, recurring, booking, ecommerce, crm_deal, automation, quote_conversion)           | How this invoice was created                                                |
| `source_id`              | text          |                                                                                                 | ID of the source entity (booking ID, order ID, deal ID, etc.)               |
| `view_token`             | text          | NOT NULL, UNIQUE                                                                                | Secure random token for public invoice viewing                              |
| `payment_token`          | text          | NOT NULL, UNIQUE                                                                                | Secure random token for online payment link                                 |
| `sent_at`                | timestamptz   |                                                                                                 | When invoice was first sent to client                                       |
| `viewed_at`              | timestamptz   |                                                                                                 | When client first viewed the invoice                                        |
| `last_reminder_sent_at`  | timestamptz   |                                                                                                 | When last overdue reminder was sent                                         |
| `reminder_count`         | integer       | DEFAULT 0                                                                                       | Number of overdue reminders sent                                            |
| `late_fee_amount`        | integer       | DEFAULT 0                                                                                       | Late fee applied in CENTS                                                   |
| `late_fee_applied_at`    | timestamptz   |                                                                                                 | When late fee was applied                                                   |
| `tags`                   | text[]        | DEFAULT '{}'                                                                                    | Tags for filtering and organization                                         |
| `metadata`               | jsonb         | DEFAULT '{}'                                                                                    | Extensible metadata                                                         |
| `created_by`             | uuid          | FK auth.users.id                                                                                | User who created                                                            |
| `created_at`             | timestamptz   | DEFAULT now()                                                                                   |                                                                             |
| `updated_at`             | timestamptz   | DEFAULT now()                                                                                   |                                                                             |

**Indexes**: `site_id`, `invoice_number`, `status`, `contact_id`, `company_id`, `storefront_customer_id`, `due_date`, `issue_date`, `recurring_invoice_id`, `source_type + source_id`, `view_token` (UNIQUE), `payment_token` (UNIQUE), `created_at`  
**UNIQUE**: `(site_id, invoice_number)` — invoice numbers must be unique within a site  
**RLS**: Agency members CRUD for their sites. Clients read-only (if `can_manage_invoices`). Service role full access (for automation engine).

#### Table 5: `mod_invmod01_invoice_line_items`

Individual line items on an invoice. Supports products, services, hours, and custom entries.

| Column            | Type          | Constraints                                              | Description                                             |
| ----------------- | ------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| `id`              | uuid          | PK, default gen_random_uuid()                            | Line item ID                                            |
| `invoice_id`      | uuid          | FK mod_invmod01_invoices.id, NOT NULL, ON DELETE CASCADE | Parent invoice                                          |
| `item_id`         | uuid          | FK mod_invmod01_items.id                                 | Reference to catalog item (optional — can be ad hoc)    |
| `sort_order`      | integer       | DEFAULT 0                                                | Display order on invoice                                |
| `name`            | text          | NOT NULL                                                 | Item name (copied from catalog or custom)               |
| `description`     | text          |                                                          | Item description                                        |
| `quantity`        | numeric(12,4) | NOT NULL, DEFAULT 1                                      | Quantity (supports decimal for hours, etc.)             |
| `unit`            | text          |                                                          | Unit of measurement                                     |
| `unit_price`      | integer       | NOT NULL                                                 | Price per unit in CENTS                                 |
| `discount_type`   | text          | CHECK (percentage, fixed)                                | Line-level discount type                                |
| `discount_value`  | integer       | DEFAULT 0                                                | Discount — percentage in basis points or fixed in CENTS |
| `discount_amount` | integer       | DEFAULT 0                                                | Calculated discount in CENTS                            |
| `tax_rate_id`     | uuid          | FK mod_invmod01_tax_rates.id                             | Tax rate applied to this line                           |
| `tax_rate`        | numeric(8,4)  | DEFAULT 0                                                | Tax rate percentage at time of invoice (snapshot)       |
| `tax_amount`      | integer       | DEFAULT 0                                                | Calculated tax in CENTS                                 |
| `subtotal`        | integer       | NOT NULL, DEFAULT 0                                      | quantity × unit_price - discount in CENTS               |
| `total`           | integer       | NOT NULL, DEFAULT 0                                      | subtotal + tax in CENTS                                 |
| `metadata`        | jsonb         | DEFAULT '{}'                                             | Extensible (e.g., link to booking, time entry, expense) |
| `created_at`      | timestamptz   | DEFAULT now()                                            |                                                         |

**Indexes**: `invoice_id`, `item_id`, `sort_order`

#### Table 6: `mod_invmod01_payments`

Payment records. Multiple payments can be applied to a single invoice (partial payments). Also records refunds.

| Column                   | Type          | Constraints                                                                                                               | Description                                                       |
| ------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `id`                     | uuid          | PK, default gen_random_uuid()                                                                                             | Payment ID                                                        |
| `site_id`                | uuid          | FK sites.id, NOT NULL                                                                                                     | Site scope                                                        |
| `invoice_id`             | uuid          | FK mod_invmod01_invoices.id, NOT NULL                                                                                     | Invoice this payment applies to                                   |
| `payment_number`         | text          |                                                                                                                           | Auto-generated payment reference (e.g., "PAY-2026-0001")          |
| `type`                   | text          | NOT NULL, DEFAULT 'payment', CHECK (payment, refund)                                                                      | Payment or refund                                                 |
| `amount`                 | integer       | NOT NULL                                                                                                                  | Amount in CENTS (positive for payment, positive for refund)       |
| `currency`               | text          | DEFAULT 'ZMW'                                                                                                             | Payment currency                                                  |
| `exchange_rate`          | numeric(18,8) | DEFAULT 1.00000000                                                                                                        | Exchange rate if paying in different currency                     |
| `payment_date`           | date          | NOT NULL, DEFAULT CURRENT_DATE                                                                                            | Date payment was received                                         |
| `payment_method`         | text          | NOT NULL, DEFAULT 'bank_transfer', CHECK (bank_transfer, cash, mobile_money, card, cheque, paypal, stripe, other, online) | How payment was made                                              |
| `payment_method_detail`  | text          |                                                                                                                           | Additional detail (e.g., "Airtel Money", "Zanaco", cheque number) |
| `transaction_reference`  | text          |                                                                                                                           | External transaction reference / receipt number                   |
| `gateway_transaction_id` | text          |                                                                                                                           | Payment gateway transaction ID (for online payments)              |
| `gateway_provider`       | text          |                                                                                                                           | Payment gateway name (e.g., "stripe", "paypal")                   |
| `proof_url`              | text          |                                                                                                                           | URL to payment proof screenshot/document                          |
| `notes`                  | text          |                                                                                                                           | Payment notes                                                     |
| `status`                 | text          | DEFAULT 'completed', CHECK (pending, completed, failed, cancelled)                                                        | Payment status                                                    |
| `recorded_by`            | uuid          | FK auth.users.id                                                                                                          | User who recorded the payment                                     |
| `metadata`               | jsonb         | DEFAULT '{}'                                                                                                              | Extensible                                                        |
| `created_at`             | timestamptz   | DEFAULT now()                                                                                                             |                                                                   |
| `updated_at`             | timestamptz   | DEFAULT now()                                                                                                             |                                                                   |

**Indexes**: `site_id`, `invoice_id`, `type`, `payment_date`, `payment_method`, `status`, `gateway_transaction_id`

#### Table 7: `mod_invmod01_recurring_invoices`

Recurring invoice templates. The system generates invoices from these on schedule.

| Column                   | Type        | Constraints                                                                             | Description                                             |
| ------------------------ | ----------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `id`                     | uuid        | PK, default gen_random_uuid()                                                           | Recurring invoice ID                                    |
| `site_id`                | uuid        | FK sites.id, NOT NULL                                                                   | Site scope                                              |
| `name`                   | text        | NOT NULL                                                                                | Template name for identification                        |
| `status`                 | text        | NOT NULL, DEFAULT 'active', CHECK (active, paused, completed, cancelled)                | Recurring status                                        |
| `contact_id`             | uuid        |                                                                                         | FK to CRM contact                                       |
| `company_id`             | uuid        |                                                                                         | FK to CRM company                                       |
| `storefront_customer_id` | uuid        |                                                                                         | FK to storefront customer                               |
| `client_name`            | text        | NOT NULL                                                                                | Recipient name                                          |
| `client_email`           | text        |                                                                                         | Recipient email                                         |
| `client_address`         | text        |                                                                                         | Recipient address                                       |
| `currency`               | text        | DEFAULT 'ZMW'                                                                           | Invoice currency                                        |
| `frequency`              | text        | NOT NULL, CHECK (weekly, biweekly, monthly, quarterly, semi_annually, annually, custom) | Generation frequency                                    |
| `custom_interval_days`   | integer     |                                                                                         | Days between generations (only when frequency = custom) |
| `start_date`             | date        | NOT NULL                                                                                | First invoice generation date                           |
| `end_date`               | date        |                                                                                         | Stop generating after this date (null = indefinite)     |
| `next_generate_date`     | date        | NOT NULL                                                                                | When to generate next invoice                           |
| `max_occurrences`        | integer     |                                                                                         | Maximum invoices to generate (null = unlimited)         |
| `occurrences_generated`  | integer     | DEFAULT 0                                                                               | Count of invoices generated so far                      |
| `auto_send`              | boolean     | DEFAULT true                                                                            | Automatically send generated invoices                   |
| `payment_terms_days`     | integer     | DEFAULT 30                                                                              | Payment terms for generated invoices                    |
| `notes`                  | text        |                                                                                         | Notes for generated invoices                            |
| `terms`                  | text        |                                                                                         | Terms for generated invoices                            |
| `subtotal`               | integer     | DEFAULT 0                                                                               | Template subtotal in CENTS                              |
| `discount_type`          | text        | CHECK (percentage, fixed)                                                               |                                                         |
| `discount_value`         | integer     | DEFAULT 0                                                                               |                                                         |
| `tax_amount`             | integer     | DEFAULT 0                                                                               |                                                         |
| `total`                  | integer     | DEFAULT 0                                                                               | Template total in CENTS                                 |
| `tags`                   | text[]      | DEFAULT '{}'                                                                            |                                                         |
| `last_generated_at`      | timestamptz |                                                                                         | When last invoice was generated                         |
| `metadata`               | jsonb       | DEFAULT '{}'                                                                            |                                                         |
| `created_by`             | uuid        | FK auth.users.id                                                                        |                                                         |
| `created_at`             | timestamptz | DEFAULT now()                                                                           |                                                         |
| `updated_at`             | timestamptz | DEFAULT now()                                                                           |                                                         |

**Indexes**: `site_id`, `status`, `next_generate_date`, `contact_id`, `company_id`

#### Table 8: `mod_invmod01_recurring_line_items`

Line items for recurring invoice templates. Copied to generated invoices.

| Column                 | Type          | Constraints                                                        | Description               |
| ---------------------- | ------------- | ------------------------------------------------------------------ | ------------------------- |
| `id`                   | uuid          | PK, default gen_random_uuid()                                      | Line item ID              |
| `recurring_invoice_id` | uuid          | FK mod_invmod01_recurring_invoices.id, NOT NULL, ON DELETE CASCADE | Parent template           |
| `item_id`              | uuid          | FK mod_invmod01_items.id                                           | Reference to catalog item |
| `sort_order`           | integer       | DEFAULT 0                                                          | Display order             |
| `name`                 | text          | NOT NULL                                                           | Item name                 |
| `description`          | text          |                                                                    | Item description          |
| `quantity`             | numeric(12,4) | NOT NULL, DEFAULT 1                                                |                           |
| `unit`                 | text          |                                                                    | Unit of measurement       |
| `unit_price`           | integer       | NOT NULL                                                           | Price per unit in CENTS   |
| `discount_type`        | text          | CHECK (percentage, fixed)                                          |                           |
| `discount_value`       | integer       | DEFAULT 0                                                          |                           |
| `tax_rate_id`          | uuid          | FK mod_invmod01_tax_rates.id                                       |                           |
| `tax_rate`             | numeric(8,4)  | DEFAULT 0                                                          |                           |
| `metadata`             | jsonb         | DEFAULT '{}'                                                       |                           |
| `created_at`           | timestamptz   | DEFAULT now()                                                      |                           |

**Indexes**: `recurring_invoice_id`, `sort_order`

#### Table 9: `mod_invmod01_credit_notes`

Credit notes issued to clients. Can be applied to invoices to reduce balance.

| Column             | Type        | Constraints                                                                              | Description                                                                      |
| ------------------ | ----------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `id`               | uuid        | PK, default gen_random_uuid()                                                            | Credit note ID                                                                   |
| `site_id`          | uuid        | FK sites.id, NOT NULL                                                                    | Site scope                                                                       |
| `credit_number`    | text        | NOT NULL                                                                                 | Generated credit note number (e.g., "CN-2026-0001")                              |
| `status`           | text        | NOT NULL, DEFAULT 'draft', CHECK (draft, issued, partially_applied, fully_applied, void) | Credit note status                                                               |
| `invoice_id`       | uuid        | FK mod_invmod01_invoices.id                                                              | Original invoice this credit relates to (optional)                               |
| `contact_id`       | uuid        |                                                                                          | FK to CRM contact                                                                |
| `company_id`       | uuid        |                                                                                          | FK to CRM company                                                                |
| `client_name`      | text        | NOT NULL                                                                                 | Recipient name                                                                   |
| `client_email`     | text        |                                                                                          |                                                                                  |
| `currency`         | text        | DEFAULT 'ZMW'                                                                            |                                                                                  |
| `issue_date`       | date        | NOT NULL, DEFAULT CURRENT_DATE                                                           |                                                                                  |
| `reason`           | text        |                                                                                          | Reason for credit (e.g., "Product return", "Service complaint", "Billing error") |
| `subtotal`         | integer     | NOT NULL, DEFAULT 0                                                                      | in CENTS                                                                         |
| `tax_amount`       | integer     | DEFAULT 0                                                                                | in CENTS                                                                         |
| `total`            | integer     | NOT NULL, DEFAULT 0                                                                      | Total credit amount in CENTS                                                     |
| `amount_applied`   | integer     | DEFAULT 0                                                                                | Amount already applied to invoices in CENTS                                      |
| `amount_remaining` | integer     | NOT NULL, DEFAULT 0                                                                      | Remaining credit available in CENTS                                              |
| `notes`            | text        |                                                                                          |                                                                                  |
| `internal_notes`   | text        |                                                                                          |                                                                                  |
| `tags`             | text[]      | DEFAULT '{}'                                                                             |                                                                                  |
| `metadata`         | jsonb       | DEFAULT '{}'                                                                             |                                                                                  |
| `created_by`       | uuid        | FK auth.users.id                                                                         |                                                                                  |
| `created_at`       | timestamptz | DEFAULT now()                                                                            |                                                                                  |
| `updated_at`       | timestamptz | DEFAULT now()                                                                            |                                                                                  |

**Indexes**: `site_id`, `credit_number`, `status`, `invoice_id`, `contact_id`, `company_id`, `issue_date`  
**UNIQUE**: `(site_id, credit_number)`

#### Table 10: `mod_invmod01_credit_note_line_items`

Line items on credit notes.

| Column           | Type          | Constraints                                                  | Description        |
| ---------------- | ------------- | ------------------------------------------------------------ | ------------------ |
| `id`             | uuid          | PK, default gen_random_uuid()                                | Line item ID       |
| `credit_note_id` | uuid          | FK mod_invmod01_credit_notes.id, NOT NULL, ON DELETE CASCADE | Parent credit note |
| `item_id`        | uuid          | FK mod_invmod01_items.id                                     |                    |
| `sort_order`     | integer       | DEFAULT 0                                                    |                    |
| `name`           | text          | NOT NULL                                                     |                    |
| `description`    | text          |                                                              |                    |
| `quantity`       | numeric(12,4) | NOT NULL, DEFAULT 1                                          |                    |
| `unit`           | text          |                                                              |                    |
| `unit_price`     | integer       | NOT NULL                                                     | in CENTS           |
| `tax_rate_id`    | uuid          | FK mod_invmod01_tax_rates.id                                 |                    |
| `tax_rate`       | numeric(8,4)  | DEFAULT 0                                                    |                    |
| `tax_amount`     | integer       | DEFAULT 0                                                    | in CENTS           |
| `subtotal`       | integer       | NOT NULL, DEFAULT 0                                          | in CENTS           |
| `total`          | integer       | NOT NULL, DEFAULT 0                                          | in CENTS           |
| `created_at`     | timestamptz   | DEFAULT now()                                                |                    |

**Indexes**: `credit_note_id`

#### Table 11: `mod_invmod01_credit_applications`

Junction table tracking which credit notes have been applied to which invoices.

| Column           | Type        | Constraints                               | Description                  |
| ---------------- | ----------- | ----------------------------------------- | ---------------------------- |
| `id`             | uuid        | PK, default gen_random_uuid()             | Application ID               |
| `credit_note_id` | uuid        | FK mod_invmod01_credit_notes.id, NOT NULL | Credit note being applied    |
| `invoice_id`     | uuid        | FK mod_invmod01_invoices.id, NOT NULL     | Invoice receiving the credit |
| `amount`         | integer     | NOT NULL                                  | Amount applied in CENTS      |
| `applied_at`     | timestamptz | DEFAULT now()                             | When the credit was applied  |
| `applied_by`     | uuid        | FK auth.users.id                          | User who applied             |
| `notes`          | text        |                                           |                              |

**Indexes**: `credit_note_id`, `invoice_id`

#### Table 12: `mod_invmod01_expenses`

Expense records for tracking business costs.

| Column              | Type          | Constraints                                                                | Description                                      |
| ------------------- | ------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| `id`                | uuid          | PK, default gen_random_uuid()                                              | Expense ID                                       |
| `site_id`           | uuid          | FK sites.id, NOT NULL                                                      | Site scope                                       |
| `expense_number`    | text          |                                                                            | Auto-generated reference (e.g., "EXP-2026-0001") |
| `category_id`       | uuid          | FK mod_invmod01_expense_categories.id                                      | Expense category                                 |
| `vendor_id`         | uuid          | FK mod_invmod01_vendors.id                                                 | Vendor this expense is from                      |
| `status`            | text          | DEFAULT 'pending', CHECK (pending, approved, rejected, paid, void)         | Expense approval status                          |
| `date`              | date          | NOT NULL, DEFAULT CURRENT_DATE                                             | Expense date                                     |
| `amount`            | integer       | NOT NULL                                                                   | Expense amount in CENTS                          |
| `currency`          | text          | DEFAULT 'ZMW'                                                              |                                                  |
| `exchange_rate`     | numeric(18,8) | DEFAULT 1.00000000                                                         |                                                  |
| `tax_rate_id`       | uuid          | FK mod_invmod01_tax_rates.id                                               | Tax rate on this expense                         |
| `tax_amount`        | integer       | DEFAULT 0                                                                  | Tax portion in CENTS                             |
| `description`       | text          | NOT NULL                                                                   | What the expense was for                         |
| `receipt_url`       | text          |                                                                            | URL to uploaded receipt image/document           |
| `receipt_filename`  | text          |                                                                            | Original filename of receipt                     |
| `payment_method`    | text          | CHECK (bank_transfer, cash, mobile_money, card, cheque, petty_cash, other) | How expense was paid                             |
| `payment_reference` | text          |                                                                            | Payment reference/receipt number                 |
| `is_billable`       | boolean       | DEFAULT false                                                              | Can be billed to a client via invoice            |
| `is_billed`         | boolean       | DEFAULT false                                                              | Has been added to an invoice                     |
| `billed_invoice_id` | uuid          | FK mod_invmod01_invoices.id                                                | Invoice this expense was billed on               |
| `contact_id`        | uuid          |                                                                            | FK to CRM contact (client to bill)               |
| `company_id`        | uuid          |                                                                            | FK to CRM company                                |
| `notes`             | text          |                                                                            | Internal notes                                   |
| `tags`              | text[]        | DEFAULT '{}'                                                               |                                                  |
| `metadata`          | jsonb         | DEFAULT '{}'                                                               |                                                  |
| `created_by`        | uuid          | FK auth.users.id                                                           |                                                  |
| `created_at`        | timestamptz   | DEFAULT now()                                                              |                                                  |
| `updated_at`        | timestamptz   | DEFAULT now()                                                              |                                                  |

**Indexes**: `site_id`, `category_id`, `vendor_id`, `status`, `date`, `is_billable + is_billed`, `contact_id`

#### Table 13: `mod_invmod01_expense_categories`

Categories for organizing expenses.

| Column        | Type        | Constraints                           | Description                                                   |
| ------------- | ----------- | ------------------------------------- | ------------------------------------------------------------- |
| `id`          | uuid        | PK, default gen_random_uuid()         | Category ID                                                   |
| `site_id`     | uuid        | FK sites.id, NOT NULL                 | Site scope                                                    |
| `name`        | text        | NOT NULL                              | Category name (e.g., "Office Supplies", "Travel", "Software") |
| `description` | text        |                                       |                                                               |
| `color`       | text        | DEFAULT '#6B7280'                     | Color for UI display                                          |
| `icon`        | text        |                                       | Lucide icon name                                              |
| `parent_id`   | uuid        | FK mod_invmod01_expense_categories.id | For subcategories (self-referencing)                          |
| `is_active`   | boolean     | DEFAULT true                          |                                                               |
| `sort_order`  | integer     | DEFAULT 0                             |                                                               |
| `created_at`  | timestamptz | DEFAULT now()                         |                                                               |

**Indexes**: `site_id`, `parent_id`, `is_active`  
**UNIQUE**: `(site_id, name, parent_id)` — unique name within parent category

#### Table 14: `mod_invmod01_vendors`

Vendor/supplier records for accounts payable.

| Column                | Type        | Constraints                   | Description                          |
| --------------------- | ----------- | ----------------------------- | ------------------------------------ |
| `id`                  | uuid        | PK, default gen_random_uuid() | Vendor ID                            |
| `site_id`             | uuid        | FK sites.id, NOT NULL         | Site scope                           |
| `name`                | text        | NOT NULL                      | Vendor/supplier name                 |
| `email`               | text        |                               |                                      |
| `phone`               | text        |                               |                                      |
| `website`             | text        |                               |                                      |
| `address`             | text        |                               |                                      |
| `city`                | text        |                               |                                      |
| `state`               | text        |                               | Province/state                       |
| `country`             | text        | DEFAULT 'ZM'                  | ISO 3166-1 alpha-2                   |
| `postal_code`         | text        |                               |                                      |
| `tax_id`              | text        |                               | Vendor tax registration number       |
| `currency`            | text        | DEFAULT 'ZMW'                 | Default currency for this vendor     |
| `payment_terms_days`  | integer     | DEFAULT 30                    | Default payment terms                |
| `bank_name`           | text        |                               | Bank name for payments               |
| `bank_account_number` | text        |                               | Bank account number                  |
| `bank_branch_code`    | text        |                               | Bank branch / routing code           |
| `mobile_money_number` | text        |                               | Mobile money number for payments     |
| `notes`               | text        |                               | Internal notes about vendor          |
| `is_active`           | boolean     | DEFAULT true                  |                                      |
| `total_billed`        | integer     | DEFAULT 0                     | Total billed in CENTS (denormalized) |
| `total_paid`          | integer     | DEFAULT 0                     | Total paid in CENTS (denormalized)   |
| `tags`                | text[]      | DEFAULT '{}'                  |                                      |
| `metadata`            | jsonb       | DEFAULT '{}'                  |                                      |
| `created_at`          | timestamptz | DEFAULT now()                 |                                      |
| `updated_at`          | timestamptz | DEFAULT now()                 |                                      |

**Indexes**: `site_id`, `name`, `email`, `is_active`

#### Table 15: `mod_invmod01_bills`

Bills received from vendors (accounts payable — the mirror of invoices receivable).

| Column                  | Type          | Constraints                                                                      | Description                           |
| ----------------------- | ------------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| `id`                    | uuid          | PK, default gen_random_uuid()                                                    | Bill ID                               |
| `site_id`               | uuid          | FK sites.id, NOT NULL                                                            | Site scope                            |
| `bill_number`           | text          | NOT NULL                                                                         | Generated or entered bill number      |
| `vendor_id`             | uuid          | FK mod_invmod01_vendors.id, NOT NULL                                             | Vendor who billed us                  |
| `vendor_bill_reference` | text          |                                                                                  | Vendor's original invoice/bill number |
| `status`                | text          | NOT NULL, DEFAULT 'draft', CHECK (draft, received, partial, paid, overdue, void) | Bill lifecycle                        |
| `currency`              | text          | DEFAULT 'ZMW'                                                                    |                                       |
| `exchange_rate`         | numeric(18,8) | DEFAULT 1.00000000                                                               |                                       |
| `issue_date`            | date          | NOT NULL, DEFAULT CURRENT_DATE                                                   |                                       |
| `due_date`              | date          | NOT NULL                                                                         |                                       |
| `paid_date`             | date          |                                                                                  |                                       |
| `subtotal`              | integer       | NOT NULL, DEFAULT 0                                                              | in CENTS                              |
| `tax_amount`            | integer       | DEFAULT 0                                                                        | in CENTS                              |
| `total`                 | integer       | NOT NULL, DEFAULT 0                                                              | in CENTS                              |
| `amount_paid`           | integer       | DEFAULT 0                                                                        | in CENTS                              |
| `amount_due`            | integer       | NOT NULL, DEFAULT 0                                                              | in CENTS                              |
| `notes`                 | text          |                                                                                  |                                       |
| `internal_notes`        | text          |                                                                                  |                                       |
| `attachment_url`        | text          |                                                                                  | URL to uploaded bill document         |
| `attachment_filename`   | text          |                                                                                  | Original filename                     |
| `purchase_order_id`     | uuid          | FK mod_invmod01_purchase_orders.id                                               | Linked purchase order                 |
| `tags`                  | text[]        | DEFAULT '{}'                                                                     |                                       |
| `metadata`              | jsonb         | DEFAULT '{}'                                                                     |                                       |
| `created_by`            | uuid          | FK auth.users.id                                                                 |                                       |
| `created_at`            | timestamptz   | DEFAULT now()                                                                    |                                       |
| `updated_at`            | timestamptz   | DEFAULT now()                                                                    |                                       |

**Indexes**: `site_id`, `bill_number`, `vendor_id`, `status`, `due_date`, `purchase_order_id`  
**UNIQUE**: `(site_id, bill_number)`

#### Table 16: `mod_invmod01_bill_line_items`

Line items on vendor bills.

| Column                | Type          | Constraints                                           | Description            |
| --------------------- | ------------- | ----------------------------------------------------- | ---------------------- |
| `id`                  | uuid          | PK, default gen_random_uuid()                         | Line item ID           |
| `bill_id`             | uuid          | FK mod_invmod01_bills.id, NOT NULL, ON DELETE CASCADE | Parent bill            |
| `expense_category_id` | uuid          | FK mod_invmod01_expense_categories.id                 | Category for this line |
| `sort_order`          | integer       | DEFAULT 0                                             |                        |
| `name`                | text          | NOT NULL                                              |                        |
| `description`         | text          |                                                       |                        |
| `quantity`            | numeric(12,4) | NOT NULL, DEFAULT 1                                   |                        |
| `unit`                | text          |                                                       |                        |
| `unit_price`          | integer       | NOT NULL                                              | in CENTS               |
| `tax_rate_id`         | uuid          | FK mod_invmod01_tax_rates.id                          |                        |
| `tax_rate`            | numeric(8,4)  | DEFAULT 0                                             |                        |
| `tax_amount`          | integer       | DEFAULT 0                                             | in CENTS               |
| `subtotal`            | integer       | NOT NULL, DEFAULT 0                                   | in CENTS               |
| `total`               | integer       | NOT NULL, DEFAULT 0                                   | in CENTS               |
| `created_at`          | timestamptz   | DEFAULT now()                                         |                        |

**Indexes**: `bill_id`, `expense_category_id`

#### Table 17: `mod_invmod01_purchase_orders`

Purchase orders sent to vendors.

| Column             | Type        | Constraints                                                                                           | Description                                |
| ------------------ | ----------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `id`               | uuid        | PK, default gen_random_uuid()                                                                         | PO ID                                      |
| `site_id`          | uuid        | FK sites.id, NOT NULL                                                                                 | Site scope                                 |
| `po_number`        | text        | NOT NULL                                                                                              | Generated PO number (e.g., "PO-2026-0001") |
| `vendor_id`        | uuid        | FK mod_invmod01_vendors.id, NOT NULL                                                                  | Vendor                                     |
| `status`           | text        | NOT NULL, DEFAULT 'draft', CHECK (draft, sent, acknowledged, partially_received, received, cancelled) | PO lifecycle                               |
| `currency`         | text        | DEFAULT 'ZMW'                                                                                         |                                            |
| `issue_date`       | date        | NOT NULL, DEFAULT CURRENT_DATE                                                                        |                                            |
| `expected_date`    | date        |                                                                                                       | Expected delivery date                     |
| `subtotal`         | integer     | NOT NULL, DEFAULT 0                                                                                   | in CENTS                                   |
| `tax_amount`       | integer     | DEFAULT 0                                                                                             | in CENTS                                   |
| `total`            | integer     | NOT NULL, DEFAULT 0                                                                                   | in CENTS                                   |
| `shipping_address` | text        |                                                                                                       | Delivery address                           |
| `notes`            | text        |                                                                                                       | Notes to vendor                            |
| `internal_notes`   | text        |                                                                                                       |                                            |
| `tags`             | text[]      | DEFAULT '{}'                                                                                          |                                            |
| `metadata`         | jsonb       | DEFAULT '{}'                                                                                          |                                            |
| `created_by`       | uuid        | FK auth.users.id                                                                                      |                                            |
| `created_at`       | timestamptz | DEFAULT now()                                                                                         |                                            |
| `updated_at`       | timestamptz | DEFAULT now()                                                                                         |                                            |

**Indexes**: `site_id`, `po_number`, `vendor_id`, `status`  
**UNIQUE**: `(site_id, po_number)`

#### Table 18: `mod_invmod01_invoice_activity`

Audit trail for all invoice-related events (sent, viewed, paid, reminded, etc.)

| Column        | Type        | Constraints                                                                               | Description                                                                                                                  |
| ------------- | ----------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `id`          | uuid        | PK, default gen_random_uuid()                                                             | Activity ID                                                                                                                  |
| `site_id`     | uuid        | FK sites.id, NOT NULL                                                                     | Site scope                                                                                                                   |
| `entity_type` | text        | NOT NULL, CHECK (invoice, credit_note, bill, purchase_order, payment, expense, recurring) | What entity this activity is about                                                                                           |
| `entity_id`   | uuid        | NOT NULL                                                                                  | ID of the entity                                                                                                             |
| `action`      | text        | NOT NULL                                                                                  | What happened (e.g., "created", "sent", "viewed", "payment_recorded", "overdue_reminder_sent", "voided", "late_fee_applied") |
| `description` | text        |                                                                                           | Human-readable description of the activity                                                                                   |
| `actor_type`  | text        | CHECK (user, system, client, automation)                                                  | Who performed the action                                                                                                     |
| `actor_id`    | uuid        |                                                                                           | User/automation ID who performed action                                                                                      |
| `actor_name`  | text        |                                                                                           | Name of actor (denormalized for display)                                                                                     |
| `old_value`   | jsonb       |                                                                                           | Previous state (for change tracking)                                                                                         |
| `new_value`   | jsonb       |                                                                                           | New state (for change tracking)                                                                                              |
| `ip_address`  | text        |                                                                                           | IP address of actor (for client views)                                                                                       |
| `metadata`    | jsonb       | DEFAULT '{}'                                                                              |                                                                                                                              |
| `created_at`  | timestamptz | DEFAULT now()                                                                             |                                                                                                                              |

**Indexes**: `site_id`, `entity_type + entity_id`, `action`, `created_at`

### Module Registration

**Add to `modules_v2` table via migration**:

```sql
INSERT INTO modules_v2 (id, slug, name, description, category, icon, is_active, features, pricing_model)
VALUES (
  gen_random_uuid(),
  'invoicing',
  'Invoicing & Finance',
  'Professional invoicing, payment tracking, recurring billing, expense management, financial reports, credit notes, vendor bills, and AI-powered financial intelligence',
  'finance',
  'Receipt',
  true,
  '["Invoice creation & PDF generation", "Partial payments & payment tracking", "Recurring invoices with auto-billing", "Credit notes & refunds", "Expense tracking & categorization", "Vendor management & purchase orders", "Financial dashboard & reports", "Multi-currency support", "Online payment links", "Overdue management & late fees", "Client portal invoice viewing", "AI financial intelligence"]',
  'included'
);
```

**Add to `module-catalog.ts`**:

```typescript
{
  id: "invoicing",
  slug: "invoicing",
  name: "Invoicing & Finance",
  description: "Professional invoicing, payment tracking, recurring billing, expense management, and financial intelligence",
  icon: "Receipt",
  category: "finance",
  features: [
    "Invoice creation with PDF generation",
    "Partial payment tracking",
    "Recurring invoices & auto-billing",
    "Credit notes & refunds",
    "Expense tracking & receipt upload",
    "Vendor management & purchase orders",
    "Financial dashboard & reports",
    "Multi-currency support",
    "Online payment links",
    "AI financial intelligence"
  ],
  pricing: { model: "included", price: 0 },
  dependencies: [],
  recommended: ["crm", "automation"]
}
```

**Add to `CORE_MODULE_SLUGS`** in `src/lib/actions/sites.ts`:

```typescript
const CORE_MODULE_SLUGS = [
  "crm",
  "automation",
  "live-chat",
  "marketing",
  "invoicing",
];
```

### Permission Changes

**Agency permissions** — add to `src/types/roles.ts`:

```typescript
manage_invoicing; // Full invoicing module access
```

**Client portal** — add column to `clients` table:

```sql
ALTER TABLE clients ADD COLUMN can_manage_invoices boolean DEFAULT false;
```

Note: `can_view_invoices` already exists in the `PortalUserPermissions` type and gates the Paddle billing page. The new `can_manage_invoices` column is **SEPARATE** — it controls access to the Invoicing module in the client portal. The existing `can_view_invoices` remains untouched and continues to gate Paddle billing.

**Client site permissions** — add column to `client_site_permissions` table:

```sql
ALTER TABLE client_site_permissions ADD COLUMN can_manage_invoices boolean;
```

### Type System

Create comprehensive TypeScript interfaces in `src/modules/invoicing/types/`. Every column above must have a corresponding camelCase TypeScript interface property.

**`invoice-types.ts`** must contain at minimum:

- `InvoicingSettings` — maps to `mod_invmod01_settings`
- `Invoice` — maps to `mod_invmod01_invoices`
- `InvoiceLineItem` — maps to `mod_invmod01_invoice_line_items`
- `InvoiceWithItems` — `Invoice & { lineItems: InvoiceLineItem[] }`
- `InvoiceStatus` — union type of all invoice statuses
- `InvoiceSourceType` — union type of all source types
- `CreateInvoiceInput` — Zod-validated input for invoice creation
- `UpdateInvoiceInput` — Zod-validated input for invoice updates

**`payment-types.ts`** must contain:

- `Payment` — maps to `mod_invmod01_payments`
- `PaymentMethod` — union type of all payment methods
- `PaymentType` — `'payment' | 'refund'`
- `CreatePaymentInput` — Zod-validated

**`recurring-types.ts`** must contain:

- `RecurringInvoice` — maps to `mod_invmod01_recurring_invoices`
- `RecurringLineItem` — maps to `mod_invmod01_recurring_line_items`
- `RecurringFrequency` — union type
- `CreateRecurringInput` — Zod-validated

**`credit-types.ts`** must contain:

- `CreditNote` — maps to `mod_invmod01_credit_notes`
- `CreditNoteLineItem` — maps to `mod_invmod01_credit_note_line_items`
- `CreditApplication` — maps to `mod_invmod01_credit_applications`
- `CreditNoteStatus` — union type

**`expense-types.ts`** must contain:

- `Expense` — maps to `mod_invmod01_expenses`
- `ExpenseCategory` — maps to `mod_invmod01_expense_categories`
- `CreateExpenseInput` — Zod-validated

**`vendor-types.ts`** must contain:

- `Vendor` — maps to `mod_invmod01_vendors`
- `Bill` — maps to `mod_invmod01_bills`
- `BillLineItem` — maps to `mod_invmod01_bill_line_items`
- `PurchaseOrder` — maps to `mod_invmod01_purchase_orders`
- `BillStatus` — union type
- `POStatus` — union type

**`tax-types.ts`** must contain:

- `TaxRate` — maps to `mod_invmod01_tax_rates`
- `TaxType` — `'inclusive' | 'exclusive'`

**`report-types.ts`** must contain:

- `ProfitAndLoss` — P&L report shape
- `ARAgingReport` — Accounts receivable aging
- `TaxSummary` — Tax collected/owed
- `ExpenseReport` — Expense breakdown
- `RevenueByPeriod` — Revenue time-series
- `CashFlowReport` — Cash in vs cash out

**`activity-types.ts`** must contain:

- `InvoiceActivity` — maps to `mod_invmod01_invoice_activity`
- `ActivityEntityType` — union type
- `ActivityActorType` — union type

### RLS Policies

Every table needs row-level security policies following the exact pattern used by other modules:

**Pattern for all `mod_invmod01_*` tables with `site_id`**:

```sql
-- Enable RLS
ALTER TABLE mod_invmod01_[table] ENABLE ROW LEVEL SECURITY;

-- Agency members: CRUD for their agency's sites
CREATE POLICY "agency_members_crud" ON mod_invmod01_[table]
  FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agencies a ON c.agency_id = a.id
      JOIN team_members tm ON tm.agency_id = a.id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Service role: Full access (for automation engine, cron jobs)
CREATE POLICY "service_role_all" ON mod_invmod01_[table]
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Navigation Configuration

**Dashboard** (`navigation.ts`) — Add under sites:

```typescript
{
  title: "Invoicing",
  href: `/dashboard/sites/${siteId}/invoicing`,
  icon: Receipt,
  dataTour: "nav-invoicing",
  children: [
    { title: "Dashboard", href: "/invoicing" },
    { title: "Invoices", href: "/invoicing/invoices" },
    { title: "Recurring", href: "/invoicing/recurring" },
    { title: "Payments", href: "/invoicing/payments" },
    { title: "Credit Notes", href: "/invoicing/credits" },
    { title: "Expenses", href: "/invoicing/expenses" },
    { title: "Items", href: "/invoicing/items" },
    { title: "Vendors", href: "/invoicing/vendors" },
    { title: "Bills", href: "/invoicing/bills" },
    { title: "Reports", href: "/invoicing/reports" },
    { title: "Settings", href: "/invoicing/settings" },
  ]
}
```

**Portal** (`portal-navigation.ts`) — Add gated by module + permission:

```typescript
if (hasModule("invoicing") && permissions.canManageInvoices) {
  // Add portal invoicing nav items
}
```

### Bootstrap Function

Create `seedDefaultInvoicingSettings(siteId: string)` — called when the invoicing module is installed on a site. It:

1. Creates a `mod_invmod01_settings` row with defaults
2. Creates a default "VAT" tax rate at 16%
3. Creates default expense categories: "Office Supplies", "Travel", "Software", "Utilities", "Rent", "Marketing", "Professional Services", "Insurance", "Equipment", "Miscellaneous"

### INV-01 Deliverables Checklist

- [ ] Migration SQL file with all 18 tables + indexes + unique constraints + RLS policies
- [ ] `mod_invmod01_settings` auto-seed function (`seedDefaultInvoicingSettings`)
- [ ] Default tax rate (16% VAT) seeded on install
- [ ] Default expense categories seeded on install
- [ ] TypeScript types for all entities (8 type files)
- [ ] Module registered in `modules_v2` table and `module-catalog.ts`
- [ ] `"invoicing"` added to `CORE_MODULE_SLUGS`
- [ ] `manage_invoicing` permission added to roles
- [ ] `can_manage_invoices` added to client permissions (migration)
- [ ] Dashboard navigation updated with Invoicing section
- [ ] Portal navigation updated with Invoicing section (gated)
- [ ] Admin navigation placeholder added
- [ ] AI Website Designer updated (`ModuleType`, Zod enum, configurator, default config)
- [ ] Auto-install mappings updated (`FEATURE_MODULE_MAP`, `COMPONENT_MODULE_MAP`)
- [ ] Industry mapping updated with invoicing module
- [ ] Constants file created (`invoicing-constants.ts`)
- [ ] Utility file created (`invoicing-utils.ts`)
- [ ] Zero TypeScript errors (`npx tsc --noEmit --skipLibCheck`)
- [ ] Successful build (`npx next build`)

---

## Phase INV-02: Invoice CRUD, PDF Generation & Number Sequencing

### Purpose

Build the complete invoice creation, editing, listing, and management workflow. This is the heart of the module — includes the invoice form with dynamic line items, smart number generation, PDF rendering for print/download, and invoice sending via email.

### Dependencies

- Phase INV-01 complete (all tables, types, permissions exist)

### Estimated Complexity

HIGH — ~30 new files (server actions, components, pages, services)

### 2.1 Server Actions (`invoice-actions.ts`)

**Functions to implement:**

| Function                | Parameters                             | Returns                                                                                                              | Description                                                                          |
| ----------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `getInvoices`           | `siteId, filters?, pagination?`        | `{ invoices: Invoice[], total: number }`                                                                             | Paginated invoice list with filters (status, date range, client, amount range, tags) |
| `getInvoice`            | `invoiceId`                            | `InvoiceWithItems & { payments: Payment[], activities: InvoiceActivity[], creditApplications: CreditApplication[] }` | Full invoice with line items, payments, activity log, credits                        |
| `createInvoice`         | `siteId, input: CreateInvoiceInput`    | `Invoice`                                                                                                            | Create draft invoice with line items, auto-generate number                           |
| `updateInvoice`         | `invoiceId, input: UpdateInvoiceInput` | `Invoice`                                                                                                            | Update draft/sent invoice (sent invoices warn about changes)                         |
| `deleteInvoice`         | `invoiceId`                            | `void`                                                                                                               | Delete draft invoice only (sent/paid cannot be deleted)                              |
| `duplicateInvoice`      | `invoiceId`                            | `Invoice`                                                                                                            | Clone invoice with new number, draft status, today's date                            |
| `sendInvoice`           | `invoiceId, emailOptions?`             | `void`                                                                                                               | Send invoice email to client, update status to "sent", log activity                  |
| `markAsSent`            | `invoiceId`                            | `void`                                                                                                               | Manually mark as sent (e.g., printed & mailed)                                       |
| `voidInvoice`           | `invoiceId, reason`                    | `void`                                                                                                               | Void an invoice (reverses any partial payments log)                                  |
| `getInvoiceStats`       | `siteId`                               | `InvoiceStats`                                                                                                       | Dashboard statistics (total outstanding, overdue, paid this period, etc.)            |
| `getInvoiceByViewToken` | `token`                                | `InvoiceWithItems`                                                                                                   | Public: Fetch invoice by secure view token                                           |
| `recordInvoiceView`     | `invoiceId, ipAddress?`                | `void`                                                                                                               | Log that client viewed the invoice                                                   |

**Validation rules:**

- Cannot edit a paid or void invoice
- Cannot delete a sent/paid/void invoice
- Cannot void a fully paid invoice (must refund first)
- Cannot send without at least one line item
- Cannot send without client email
- Due date must be >= issue date
- All monetary amounts must be >= 0

### 2.2 Invoice Number Service (`invoice-number-service.ts`)

**Atomic sequential number generation** — MUST use Supabase RPC or `FOR UPDATE` lock:

```sql
-- Function: generate_next_invoice_number(site_id uuid, doc_type text)
-- Returns the next number and increments the counter atomically
-- doc_type: 'invoice', 'credit_note', 'bill', 'po'
```

**Format tokens supported:**

- `{prefix}` — configured prefix (e.g., "INV")
- `{year}` — 4-digit year
- `{month}` — 2-digit month
- `{number}` — zero-padded sequential number

**Examples:**

- `INV-2026-0001` (default format: `{prefix}-{year}-{number}`)
- `INV/2026/06/0001` (custom: `{prefix}/{year}/{month}/{number}`)
- `0001` (custom: `{number}`)

### 2.3 Invoice PDF Service (`invoice-pdf-service.ts`)

Uses the same browser print-to-PDF pattern as E-Commerce's `invoice-template.tsx`. Creates a React-based print-ready layout.

**PDF template includes:**

- Company letterhead (logo, name, address, tax ID from settings)
- Invoice number, issue date, due date, payment terms
- Client details (name, address, email, tax ID)
- Line items table (name, description, qty, unit price, discount, tax, total)
- Subtotal, discount, tax breakdown, grand total
- Amount paid (if partial), balance due
- Payment instructions
- Notes and terms sections
- Footer text

**The PDF route** (`/dashboard/sites/[siteId]/invoicing/invoices/[id]/pdf/`) renders a standalone page with `@media print` styling, no dashboard layout.

### 2.4 Invoice Email Service

When sending an invoice:

1. Render branded HTML email using Resend with site branding
2. Include: invoice number, amount due, due date, "View Invoice" button (links to public view token URL)
3. Optionally attach PDF (if setting enabled)
4. Log `invoice_activity` entry with action "sent"
5. Update invoice status to "sent"
6. Fire `accounting.invoice.sent` automation event

**Email template variables:**

- `{{client_name}}` — recipient name
- `{{invoice_number}}` — e.g., INV-2026-0001
- `{{amount_due}}` — formatted amount with currency
- `{{due_date}}` — formatted due date
- `{{view_url}}` — secure invoice view link
- `{{company_name}}` — sender business name

### 2.5 Components

| Component               | File                          | Description                                                                                                                     |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `InvoiceList`           | `invoice-list.tsx`            | Paginated table with status badges, amount, client name, due date. Bulk actions (send, void). Search and filter bar.            |
| `InvoiceDetail`         | `invoice-detail.tsx`          | Full invoice view with action toolbar, line items, payment history, activity log, credit applications                           |
| `InvoiceForm`           | `invoice-form.tsx`            | Create/edit form with: contact picker (CRM), line item editor, date pickers, discount, tax, notes/terms, live total calculation |
| `InvoiceLineItems`      | `invoice-line-items.tsx`      | Dynamic line item editor — add/remove/reorder rows. Item catalog quick-add. Auto-calculate per-row and totals                   |
| `InvoicePdfTemplate`    | `invoice-pdf-template.tsx`    | Print-ready invoice template for PDF generation. Uses `@media print` styling                                                    |
| `InvoiceActionsToolbar` | `invoice-actions-toolbar.tsx` | Button bar: Send, Mark as Sent, Record Payment, Void, Duplicate, Download PDF, Copy View Link                                   |
| `InvoiceActivityLog`    | `invoice-activity-log.tsx`    | Timeline of events: created → sent → viewed → payment recorded → etc.                                                           |
| `InvoiceStatusBadge`    | `invoice-status-badge.tsx`    | Color-coded badge: Draft (gray), Sent (blue), Viewed (purple), Partial (yellow), Paid (green), Overdue (red), Void (black)      |
| `InvoiceFilters`        | `invoice-filters.tsx`         | Filter bar: status dropdown, date range, client search, amount range, tags                                                      |
| `InvoicePreview`        | `invoice-preview.tsx`         | Live preview panel shown alongside the form — updates as user types                                                             |
| `ContactInvoicePicker`  | `contact-invoice-picker.tsx`  | CRM contact/company selector with search, shows name + email + company. Auto-fills client fields                                |
| `ItemPicker`            | `item-picker.tsx`             | Quick-add from item catalog — search items, click to add as line item                                                           |
| `TaxRateSelector`       | `tax-rate-selector.tsx`       | Dropdown selector for tax rates configured in settings                                                                          |
| `AmountDisplay`         | `amount-display.tsx`          | Formatted currency display (e.g., "K 1,250.00" for 125000 cents)                                                                |

### 2.6 Pages

| Route                                  | Page       | Description                                  |
| -------------------------------------- | ---------- | -------------------------------------------- |
| `/invoicing/invoices/`                 | `page.tsx` | Invoice list page with InvoiceList component |
| `/invoicing/invoices/new/`             | `page.tsx` | Create invoice page with InvoiceForm         |
| `/invoicing/invoices/[invoiceId]/`     | `page.tsx` | Invoice detail with InvoiceDetail            |
| `/invoicing/invoices/[invoiceId]/pdf/` | `page.tsx` | Print-ready PDF preview page                 |

### 2.7 API Routes

| Route                         | Method | Description                                                |
| ----------------------------- | ------ | ---------------------------------------------------------- |
| `/api/invoicing/view/[token]` | GET    | Public invoice view — returns rendered HTML page (no auth) |
| `/api/invoicing/pdf/[token]`  | GET    | Public PDF download (no auth, rate-limited)                |

### 2.8 Automation Events Fired

| Event                        | When                               |
| ---------------------------- | ---------------------------------- |
| `accounting.invoice.created` | Invoice created (any source)       |
| `accounting.invoice.sent`    | Invoice sent to client via email   |
| `accounting.invoice.viewed`  | Client opens invoice via view link |

### INV-02 Deliverables Checklist

- [ ] `invoice-actions.ts` — all 11 server action functions
- [ ] `invoice-number-service.ts` — atomic number generation with configurable formats
- [ ] `invoice-pdf-service.ts` — PDF rendering service
- [ ] Invoice email template (Resend HTML template with branding)
- [ ] All 14 components listed above
- [ ] All 4 dashboard pages
- [ ] 2 API routes (public view + PDF download)
- [ ] Invoice activity logging for all state changes
- [ ] Automation events fired (created, sent, viewed)
- [ ] `item-actions.ts` — Item/service catalog CRUD
- [ ] Items page (`/invoicing/items/`)
- [ ] Settings page (`/invoicing/settings/`) — basic settings form
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-03: Payment Recording, Partial Payments & Payment Methods

### Purpose

Build the complete payment recording workflow — accepting full or partial payments against invoices, recording payment method details, handling overpayments, generating payment receipts, and tracking payment history across the site.

### Dependencies

- Phase INV-02 complete (invoice CRUD + line items exist)

### Estimated Complexity

MEDIUM — ~15 new files

### 3.1 Server Actions (`payment-actions.ts`)

| Function            | Parameters                             | Returns                                  | Description                                                                                  |
| ------------------- | -------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `recordPayment`     | `invoiceId, input: CreatePaymentInput` | `Payment`                                | Record a payment against an invoice. Updates invoice `amount_paid`, `amount_due`, and status |
| `getPayments`       | `siteId, filters?, pagination?`        | `{ payments: Payment[], total: number }` | All payments across site (or filtered by invoice, date, method)                              |
| `getPayment`        | `paymentId`                            | `Payment & { invoice: Invoice }`         | Single payment with parent invoice                                                           |
| `updatePayment`     | `paymentId, input`                     | `Payment`                                | Edit payment details (only pending or recent completed payments)                             |
| `deletePayment`     | `paymentId`                            | `void`                                   | Delete pending payment or reverse completed payment (creates activity log)                   |
| `recordRefund`      | `invoiceId, input: CreateRefundInput`  | `Payment`                                | Record a refund (type = 'refund'). Updates invoice totals.                                   |
| `getPaymentSummary` | `siteId, dateRange?`                   | `PaymentSummary`                         | Summary: total collected, by method, by period                                               |

**Payment recording logic:**

```
1. Validate: amount > 0, invoice exists, invoice not void/cancelled
2. Create payment record
3. Update invoice: amount_paid += payment.amount
4. Recalculate: amount_due = total - amount_paid - credits_applied
5. Update invoice status:
   - If amount_due <= 0: status = 'paid', paid_date = today
   - If amount_due > 0 && amount_paid > 0: status = 'partial'
6. Log invoice_activity: "payment_recorded" with amount + method
7. Fire automation event: accounting.payment.received
8. If fully paid, also fire: accounting.invoice.paid
9. If overpayment (amount_paid > total), create activity log warning
```

**Refund logic:**

```
1. Validate: amount > 0, amount <= amount_paid, invoice is paid/partial
2. Create payment record with type = 'refund'
3. Update invoice: amount_paid -= refund.amount
4. Recalculate: amount_due = total - amount_paid - credits_applied
5. Update invoice status based on new amount_due
6. Log invoice_activity: "refund_recorded"
7. Fire automation event: accounting.payment.refunded
```

### 3.2 Payment Receipt

When a payment is recorded:

- If client email exists and settings.online_payment_enabled, send payment receipt email
- Receipt includes: invoice number, amount paid, payment method, remaining balance, date

### 3.3 Components

| Component            | File                       | Description                                                                                                     |
| -------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `PaymentForm`        | `payment-form.tsx`         | Record payment dialog — amount (prefill with amount_due), date, method dropdown, reference, notes, proof upload |
| `PaymentList`        | `payment-list.tsx`         | All payments across site — table with invoice link, amount, method, date. Filter by method, date range          |
| `PaymentDetail`      | `payment-detail.tsx`       | Payment details with linked invoice, proof image, notes                                                         |
| `PaymentMethodIcon`  | `payment-method-icon.tsx`  | Visual icon + label for payment methods (bank icon, cash icon, mobile money icon, etc.)                         |
| `PaymentSummaryCard` | `payment-summary-card.tsx` | Dashboard widget showing payment totals by method                                                               |
| `RefundForm`         | `refund-form.tsx`          | Record refund dialog — amount, reason, method                                                                   |
| `PaymentProofUpload` | `payment-proof-upload.tsx` | Upload payment proof screenshot (reuse pattern from E-Commerce proof upload)                                    |

### 3.4 Pages

| Route                  | Page       | Description                           |
| ---------------------- | ---------- | ------------------------------------- |
| `/invoicing/payments/` | `page.tsx` | Payment list page across all invoices |

Note: Payment recording and viewing is also accessible from the Invoice Detail page (INV-02).

### 3.5 Automation Events Fired

| Event                                | When                                      |
| ------------------------------------ | ----------------------------------------- |
| `accounting.payment.received`        | Payment recorded (full or partial)        |
| `accounting.invoice.paid`            | Invoice fully paid (amount_due = 0)       |
| `accounting.invoice.partial_payment` | Partial payment recorded (amount_due > 0) |
| `accounting.payment.refunded`        | Refund recorded                           |

### INV-03 Deliverables Checklist

- [ ] `payment-actions.ts` — all 7 server action functions
- [ ] Payment recording with automatic invoice status updates
- [ ] Refund recording with automatic invoice status reversal
- [ ] Payment receipt email (via Resend)
- [ ] All 7 components
- [ ] Payments page
- [ ] Payment recording integrated into invoice detail page
- [ ] Proof upload for payments
- [ ] Automation events (4 events)
- [ ] Activity log entries for all payment actions
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-04: Recurring Invoices, Auto-Billing & Schedules

### Purpose

Build the recurring invoice template system — create templates that auto-generate invoices on a schedule (weekly, monthly, quarterly, yearly, or custom). Includes schedule management, auto-send, preview of upcoming generations, and integration with the automation engine.

### Dependencies

- Phase INV-02 complete (invoice creation exists to generate into)

### Estimated Complexity

MEDIUM — ~12 new files

### 4.1 Server Actions (`recurring-actions.ts`)

| Function                 | Parameters                            | Returns                                                                               | Description                                                  |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `getRecurringInvoices`   | `siteId, filters?, pagination?`       | `{ recurring: RecurringInvoice[], total: number }`                                    | List recurring templates                                     |
| `getRecurringInvoice`    | `recurringId`                         | `RecurringInvoice & { lineItems: RecurringLineItem[], generatedInvoices: Invoice[] }` | Full template with items + generation history                |
| `createRecurringInvoice` | `siteId, input: CreateRecurringInput` | `RecurringInvoice`                                                                    | Create template with line items                              |
| `updateRecurringInvoice` | `recurringId, input`                  | `RecurringInvoice`                                                                    | Update template (does not affect already-generated invoices) |
| `deleteRecurringInvoice` | `recurringId`                         | `void`                                                                                | Delete template (does not delete generated invoices)         |
| `pauseRecurringInvoice`  | `recurringId`                         | `void`                                                                                | Pause auto-generation                                        |
| `resumeRecurringInvoice` | `recurringId`                         | `void`                                                                                | Resume auto-generation                                       |
| `generateNow`            | `recurringId`                         | `Invoice`                                                                             | Manually trigger invoice generation from template            |
| `getUpcomingGenerations` | `recurringId, count?`                 | `Date[]`                                                                              | Preview next N generation dates                              |

### 4.2 Recurring Engine Service (`recurring-engine-service.ts`)

**Cron endpoint**: `/api/invoicing/recurring/process` — called daily via Vercel Cron.

**Processing logic:**

```
1. Query all active recurring invoices where next_generate_date <= today
2. For each:
   a. Generate invoice from template:
      - Copy all line items
      - Generate new invoice number
      - Set issue_date = today, due_date = today + payment_terms_days
      - Set source_type = 'recurring', source_id = recurring_invoice_id
   b. If auto_send = true: send invoice immediately
   c. Calculate next_generate_date based on frequency
   d. Increment occurrences_generated
   e. If max_occurrences reached: set status = 'completed'
   f. Log activity
   g. Fire automation event: accounting.invoice.created (with source=recurring)
3. Return summary of processed recurring invoices
```

**Next date calculation:**

- `weekly`: +7 days
- `biweekly`: +14 days
- `monthly`: +1 month (same day, or last day of month if doesn't exist)
- `quarterly`: +3 months
- `semi_annually`: +6 months
- `annually`: +1 year
- `custom`: +custom_interval_days

### 4.3 Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/invoicing/recurring/process",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Runs daily at 06:00 UTC (08:00 Lusaka time).

### 4.4 Components

| Component                  | File                             | Description                                                                                                 |
| -------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `RecurringList`            | `recurring-list.tsx`             | List of recurring templates — name, client, frequency, next date, status, total                             |
| `RecurringForm`            | `recurring-form.tsx`             | Create/edit form — client picker, frequency, start/end dates, max occurrences, line items, auto-send toggle |
| `RecurringDetail`          | `recurring-detail.tsx`           | Template detail — settings, line items, generation history (list of generated invoices), upcoming dates     |
| `RecurringSchedulePreview` | `recurring-schedule-preview.tsx` | Visual calendar showing next N generation dates                                                             |
| `FrequencySelector`        | `frequency-selector.tsx`         | Dropdown for frequency selection with custom interval support                                               |

### 4.5 Pages

| Route                                 | Page       | Description               |
| ------------------------------------- | ---------- | ------------------------- |
| `/invoicing/recurring/`               | `page.tsx` | Recurring template list   |
| `/invoicing/recurring/new/`           | `page.tsx` | Create recurring template |
| `/invoicing/recurring/[recurringId]/` | `page.tsx` | Recurring template detail |

### 4.6 API Routes

| Route                              | Method | Description                                      |
| ---------------------------------- | ------ | ------------------------------------------------ |
| `/api/invoicing/recurring/process` | GET    | Cron endpoint — processes due recurring invoices |

### INV-04 Deliverables Checklist

- [ ] `recurring-actions.ts` — all 9 server action functions
- [ ] `recurring-engine-service.ts` — cron processing logic
- [ ] Cron API route
- [ ] Vercel cron configuration
- [ ] Next date calculation for all frequencies
- [ ] All 5 components
- [ ] All 3 dashboard pages
- [ ] Auto-send integration with invoice email service
- [ ] Activity logging for recurring generation
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-05: Credit Notes, Refunds & Adjustments

### Purpose

Build the credit note system — create credit notes (for returns, billing errors, service complaints), apply credits against invoices to reduce balances, track credit note lifecycle, and maintain an accurate credit balance per client.

### Dependencies

- Phase INV-03 complete (payment recording exists — credit notes interact with invoice balances)

### Estimated Complexity

MEDIUM — ~12 new files

### 5.1 Server Actions (`credit-actions.ts`)

| Function                 | Parameters                             | Returns                                                                                                            | Description                                                                |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `getCreditNotes`         | `siteId, filters?, pagination?`        | `{ creditNotes: CreditNote[], total: number }`                                                                     | List credit notes with filters (status, client, date range)                |
| `getCreditNote`          | `creditNoteId`                         | `CreditNote & { lineItems: CreditNoteLineItem[], applications: CreditApplication[], activity: InvoiceActivity[] }` | Full credit note with line items + application history                     |
| `createCreditNote`       | `siteId, input: CreateCreditNoteInput` | `CreditNote`                                                                                                       | Create draft credit note with line items                                   |
| `updateCreditNote`       | `creditNoteId, input`                  | `CreditNote`                                                                                                       | Update draft credit note                                                   |
| `deleteCreditNote`       | `creditNoteId`                         | `void`                                                                                                             | Delete draft only                                                          |
| `issueCreditNote`        | `creditNoteId`                         | `void`                                                                                                             | Issue credit note (status → "issued"), making it available for application |
| `applyCreditToInvoice`   | `creditNoteId, invoiceId, amount`      | `CreditApplication`                                                                                                | Apply credit to an invoice                                                 |
| `voidCreditNote`         | `creditNoteId, reason`                 | `void`                                                                                                             | Void a credit note (reverses all applications)                             |
| `getClientCreditBalance` | `siteId, contactId`                    | `{ totalIssued: number, totalApplied: number, available: number }`                                                 | Available credit for a specific client                                     |

**Apply credit logic:**

```
1. Validate: credit note is issued, amount <= credit.amount_remaining, invoice exists, invoice has balance > 0
2. amount = min(requested_amount, credit.amount_remaining, invoice.amount_due)
3. Create credit_application record
4. Update credit note: amount_applied += amount, amount_remaining -= amount
5. If amount_remaining = 0: status = 'fully_applied'
6. Else: status = 'partially_applied'
7. Update invoice: credits_applied += amount, amount_due -= amount
8. If invoice.amount_due <= 0: invoice.status = 'paid'
9. Log activity on both credit note and invoice
```

**Void credit logic (reversal):**

```
1. For each credit_application linked to this credit note:
   a. Reverse: invoice.credits_applied -= application.amount
   b. invoice.amount_due += application.amount
   c. Recalculate invoice status
2. Set credit note status = 'void'
3. Log activity
```

### 5.2 Components

| Component             | File                        | Description                                                                                                     |
| --------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `CreditList`          | `credit-list.tsx`           | Credit note list — number, client, status, total, amount remaining                                              |
| `CreditForm`          | `credit-form.tsx`           | Create/edit credit note — linked invoice (optional), reason, line items                                         |
| `CreditDetail`        | `credit-detail.tsx`         | Full credit note view — line items, application history, remaining balance                                      |
| `CreditApplyDialog`   | `credit-apply-dialog.tsx`   | Modal to apply credit to an invoice — shows available invoices for this client, enter amount                    |
| `CreditStatusBadge`   | `credit-status-badge.tsx`   | Color-coded badge: Draft (gray), Issued (blue), Partially Applied (yellow), Fully Applied (green), Void (black) |
| `ClientCreditBalance` | `client-credit-balance.tsx` | Widget showing available credit balance for a contact                                                           |

### 5.3 Pages

| Route                            | Page       | Description        |
| -------------------------------- | ---------- | ------------------ |
| `/invoicing/credits/`            | `page.tsx` | Credit note list   |
| `/invoicing/credits/new/`        | `page.tsx` | Create credit note |
| `/invoicing/credits/[creditId]/` | `page.tsx` | Credit note detail |

### 5.4 Invoice Detail Integration

Add to the invoice detail page (from INV-02):

- "Apply Credit" button (opens CreditApplyDialog showing available credits for this contact)
- Credit applications section showing applied credits with amounts and dates

### INV-05 Deliverables Checklist

- [ ] `credit-actions.ts` — all 9 server action functions
- [ ] Credit-to-invoice application logic with bidirectional balance updates
- [ ] Void with reversal logic
- [ ] All 6 components
- [ ] All 3 dashboard pages
- [ ] Credit application integrated into invoice detail page
- [ ] Client credit balance query
- [ ] Activity logging for all credit note actions
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-06: Expense Tracking, Categories & Receipt Upload

### Purpose

Build the expense tracking system — record business expenses, categorize them, upload receipts, mark expenses as billable, and convert billable expenses into invoice line items. This is the cost side of the financial picture.

### Dependencies

- Phase INV-01 complete (expense tables + categories exist)
- Phase INV-02 complete (for billable expense → invoice line item conversion)

### Estimated Complexity

MEDIUM — ~12 new files

### 6.1 Server Actions (`expense-actions.ts`)

| Function                | Parameters                          | Returns                                                                                | Description                                                                                        |
| ----------------------- | ----------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `getExpenses`           | `siteId, filters?, pagination?`     | `{ expenses: Expense[], total: number }`                                               | Paginated expense list with filters (category, vendor, status, date range, billable, amount range) |
| `getExpense`            | `expenseId`                         | `Expense & { category: ExpenseCategory, vendor: Vendor, activity: InvoiceActivity[] }` | Full expense with related data                                                                     |
| `createExpense`         | `siteId, input: CreateExpenseInput` | `Expense`                                                                              | Create expense with optional receipt upload                                                        |
| `updateExpense`         | `expenseId, input`                  | `Expense`                                                                              | Update expense (cannot update if billed)                                                           |
| `deleteExpense`         | `expenseId`                         | `void`                                                                                 | Delete expense (cannot delete if billed)                                                           |
| `approveExpense`        | `expenseId`                         | `void`                                                                                 | Approve pending expense                                                                            |
| `rejectExpense`         | `expenseId, reason`                 | `void`                                                                                 | Reject pending expense with reason                                                                 |
| `convertToInvoiceItem`  | `expenseIds[], invoiceId`           | `void`                                                                                 | Add billable expenses as line items on an invoice, mark as billed                                  |
| `getExpenseStats`       | `siteId, dateRange?`                | `ExpenseStats`                                                                         | Summary: total by category, by vendor, by month                                                    |
| `getExpenseCategories`  | `siteId`                            | `ExpenseCategory[]`                                                                    | List all categories (with subcategories nested)                                                    |
| `createExpenseCategory` | `siteId, input`                     | `ExpenseCategory`                                                                      | Create category                                                                                    |
| `updateExpenseCategory` | `categoryId, input`                 | `ExpenseCategory`                                                                      | Update category                                                                                    |
| `deleteExpenseCategory` | `categoryId`                        | `void`                                                                                 | Delete category (fails if expenses reference it)                                                   |

### 6.2 Receipt Upload

- Uses Supabase Storage bucket: `invoicing-receipts`
- Accepts: JPEG, PNG, PDF, HEIC
- Max size: 10MB
- Stores URL in `expense.receipt_url`
- Receipt preview in expense detail (image viewer or PDF iframe)

### 6.3 Billable Expense → Invoice Conversion

When converting billable expenses to invoice line items:

```
1. For each selected expense:
   a. Create invoice line item:
      - name = expense.description
      - unit_price = expense.amount
      - quantity = 1
      - tax_rate = expense.tax_rate (if applicable)
      - metadata = { source: "expense", expense_id: expense.id }
   b. Mark expense: is_billed = true, billed_invoice_id = invoice.id
2. Recalculate invoice totals
3. Log activity on both expense and invoice
```

### 6.4 Components

| Component                 | File                            | Description                                                                                                                                                     |
| ------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ExpenseList`             | `expense-list.tsx`              | Paginated table — description, amount, category (color chip), vendor, date, status, billable badge. Filter bar.                                                 |
| `ExpenseForm`             | `expense-form.tsx`              | Create/edit form — date, amount, category dropdown, vendor dropdown, description, payment method, receipt upload, billable toggle, client picker (for billable) |
| `ExpenseDetail`           | `expense-detail.tsx`            | Full expense view — all fields, receipt preview, activity log, linked invoice (if billed)                                                                       |
| `ExpenseCategoryManager`  | `expense-category-manager.tsx`  | Category CRUD interface — tree view for parent/child categories, color + icon picker, drag reorder                                                              |
| `ReceiptUpload`           | `receipt-upload.tsx`            | Drag-and-drop receipt upload with preview (image viewer for JPEG/PNG, PDF preview for PDFs)                                                                     |
| `ExpenseStatsCard`        | `expense-stats-card.tsx`        | Dashboard widget — total expenses by category (pie chart), monthly trend, top vendors                                                                           |
| `BillableExpenseSelector` | `billable-expense-selector.tsx` | Multi-select dialog for choosing unbilled billable expenses to add to an invoice                                                                                |

### 6.5 Pages

| Route                              | Page       | Description    |
| ---------------------------------- | ---------- | -------------- |
| `/invoicing/expenses/`             | `page.tsx` | Expense list   |
| `/invoicing/expenses/new/`         | `page.tsx` | Create expense |
| `/invoicing/expenses/[expenseId]/` | `page.tsx` | Expense detail |

### 6.6 Automation Events Fired

| Event                         | When             |
| ----------------------------- | ---------------- |
| `accounting.expense.created`  | Expense recorded |
| `accounting.expense.approved` | Expense approved |
| `accounting.expense.rejected` | Expense rejected |

### INV-06 Deliverables Checklist

- [ ] `expense-actions.ts` — all 13 server action functions
- [ ] Supabase Storage bucket creation for receipts
- [ ] Receipt upload service
- [ ] Billable expense → invoice line item conversion
- [ ] Expense category CRUD with tree structure
- [ ] All 7 components
- [ ] All 3 dashboard pages
- [ ] Automation events (3 events)
- [ ] Activity logging
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-07: Financial Dashboard, Reports & P&L Statements

### Purpose

Build the financial dashboard (the invoicing module landing page) and the full suite of financial reports: Profit & Loss, Accounts Receivable Aging, Tax Summary, Expense Report, and Revenue by Period. This phase transforms raw invoice/payment/expense data into actionable financial insights.

### Dependencies

- Phase INV-03 complete (payment data exists)
- Phase INV-06 complete (expense data exists)

### Estimated Complexity

HIGH — ~18 new files (components are chart-heavy)

### 7.1 Server Actions (`report-actions.ts`)

| Function                       | Parameters                                                                       | Returns                       | Description                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `getDashboardMetrics`          | `siteId`                                                                         | `DashboardMetrics`            | Overview numbers: total revenue, outstanding, overdue, expenses, net profit, invoice count by status            |
| `getRevenueByPeriod`           | `siteId, period: 'daily'\|'weekly'\|'monthly'\|'quarterly'\|'yearly', dateRange` | `RevenueByPeriod[]`           | Revenue time-series for charts                                                                                  |
| `getCashFlowReport`            | `siteId, dateRange`                                                              | `CashFlowReport`              | Cash in (payments received) vs cash out (bills paid + expenses) by period                                       |
| `getProfitAndLoss`             | `siteId, dateRange`                                                              | `ProfitAndLoss`               | Income (invoices paid) - Expenses (expenses + bills paid) = Net Profit, broken down by category                 |
| `getARAgingReport`             | `siteId`                                                                         | `ARAgingReport`               | Outstanding invoices grouped by age: Current, 1-30 days, 31-60 days, 61-90 days, 90+ days. Per-client breakdown |
| `getTaxSummary`                | `siteId, dateRange`                                                              | `TaxSummary`                  | Tax collected on invoices, tax paid on expenses/bills. Net tax liability                                        |
| `getExpenseReport`             | `siteId, dateRange, groupBy: 'category'\|'vendor'\|'month'`                      | `ExpenseReport`               | Expense breakdown by chosen dimension with totals and percentages                                               |
| `getTopClients`                | `siteId, limit?, dateRange?`                                                     | `TopClient[]`                 | Clients ranked by revenue: name, total invoiced, total paid, outstanding                                        |
| `getPaymentMethodDistribution` | `siteId, dateRange?`                                                             | `PaymentMethodDistribution[]` | Payment amounts by method (pie chart data)                                                                      |
| `getInvoiceStatusDistribution` | `siteId`                                                                         | `InvoiceStatusDistribution[]` | Count of invoices by status (donut chart data)                                                                  |

### 7.2 Dashboard Metrics Type

```typescript
interface DashboardMetrics {
  totalRevenue: number; // Total paid amount (all time or period) in CENTS
  totalOutstanding: number; // Total amount_due across all unpaid invoices in CENTS
  totalOverdue: number; // Amount_due on invoices past due_date in CENTS
  overdueCount: number; // Number of overdue invoices
  totalExpenses: number; // Total expenses (approved + paid) in CENTS
  netProfit: number; // Revenue - expenses in CENTS
  invoicesSent: number; // Count of invoices sent this period
  invoicesPaid: number; // Count of invoices paid this period
  averagePaymentDays: number; // Average days from sent to paid
  collectionRate: number; // Percentage of invoiced amount that's been collected
}
```

### 7.3 P&L Report Shape

```typescript
interface ProfitAndLoss {
  period: { start: string; end: string };
  income: {
    total: number;
    byCategory: { category: string; amount: number }[];
  };
  expenses: {
    total: number;
    byCategory: { category: string; amount: number }[];
  };
  netProfit: number;
  netProfitMargin: number; // percentage
}
```

### 7.4 AR Aging Report Shape

```typescript
interface ARAgingReport {
  summary: {
    current: number; // 0 days overdue
    days1to30: number; // 1-30 days overdue
    days31to60: number; // 31-60 days overdue
    days61to90: number; // 61-90 days overdue
    days90plus: number; // 90+ days overdue
    total: number;
  };
  byClient: {
    clientName: string;
    contactId: string;
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
    days90plus: number;
    total: number;
  }[];
}
```

### 7.5 Components

| Component              | File                         | Description                                                                                       |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `FinanceDashboard`     | `finance-dashboard.tsx`      | Main invoicing landing page — grid of metric cards + charts                                       |
| `RevenueWidget`        | `revenue-widget.tsx`         | Card: total revenue with period comparison (vs last month/quarter)                                |
| `OutstandingWidget`    | `outstanding-widget.tsx`     | Card: total outstanding amount with invoice count                                                 |
| `OverdueWidget`        | `overdue-widget.tsx`         | Card: total overdue amount with count, red styling                                                |
| `RecentInvoicesWidget` | `recent-invoices-widget.tsx` | Table: 5 most recent invoices with status + amount                                                |
| `CashFlowChart`        | `cash-flow-chart.tsx`        | Bar chart: cash in (green) vs cash out (red) by period. Uses Recharts                             |
| `PaymentMethodChart`   | `payment-method-chart.tsx`   | Pie chart: payment distribution by method. Uses Recharts                                          |
| `InvoiceStatusChart`   | `invoice-status-chart.tsx`   | Donut chart: invoice count by status. Uses Recharts                                               |
| `RevenueChart`         | `revenue-chart.tsx`          | Line/area chart: revenue over time. Uses Recharts                                                 |
| `ReportHub`            | `report-hub.tsx`             | Reports landing page — cards linking to each report type                                          |
| `PnlReport`            | `pnl-report.tsx`             | P&L statement with income/expense breakdown, date range picker, export                            |
| `ARAgingReport`        | `ar-aging-report.tsx`        | Aging table: summary row + per-client rows with color-coded aging buckets                         |
| `TaxSummaryReport`     | `tax-summary-report.tsx`     | Tax collected vs tax paid, net liability, by tax rate                                             |
| `ExpenseReportView`    | `expense-report.tsx`         | Expense breakdown with grouping selector (category/vendor/month), bar chart + table               |
| `DateRangeFilter`      | `date-range-filter.tsx`      | Reusable date range picker with presets (This Month, Last Month, This Quarter, This Year, Custom) |
| `MetricCard`           | `metric-card.tsx`            | Reusable dashboard metric card with icon, value, label, trend arrow                               |

### 7.6 Pages

| Route                          | Page       | Description                                    |
| ------------------------------ | ---------- | ---------------------------------------------- |
| `/invoicing/`                  | `page.tsx` | Financial dashboard (main module landing page) |
| `/invoicing/reports/`          | `page.tsx` | Report hub                                     |
| `/invoicing/reports/pnl/`      | `page.tsx` | P&L report                                     |
| `/invoicing/reports/aging/`    | `page.tsx` | AR aging report                                |
| `/invoicing/reports/tax/`      | `page.tsx` | Tax summary                                    |
| `/invoicing/reports/expenses/` | `page.tsx` | Expense report                                 |

### INV-07 Deliverables Checklist

- [ ] `report-actions.ts` — all 10 server action functions
- [ ] Dashboard metrics aggregation queries (optimized SQL)
- [ ] P&L calculation engine
- [ ] AR aging bucketing logic
- [ ] Tax summary computation
- [ ] All 16 components (chart-heavy — uses Recharts)
- [ ] All 6 pages
- [ ] Date range filter with presets
- [ ] Export functionality (CSV download for each report)
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-08: Tax Management, Multi-Currency & Compliance

### Purpose

Build advanced tax management (multiple rates, compound taxes, inclusive/exclusive calculations, tax groups), multi-currency support with exchange rates, and tax compliance features. This phase ensures the invoicing system works for businesses operating across borders or with complex tax requirements.

### Dependencies

- Phase INV-01 complete (tax_rates table exists)
- Phase INV-02 complete (invoice form exists to add tax UI)

### Estimated Complexity

MEDIUM — ~10 new files + modifications to existing invoice forms

### 8.1 Server Actions (`tax-actions.ts`)

| Function            | Parameters          | Returns     | Description                                                                  |
| ------------------- | ------------------- | ----------- | ---------------------------------------------------------------------------- |
| `getTaxRates`       | `siteId`            | `TaxRate[]` | List all tax rates for site                                                  |
| `createTaxRate`     | `siteId, input`     | `TaxRate`   | Create new tax rate                                                          |
| `updateTaxRate`     | `taxRateId, input`  | `TaxRate`   | Update tax rate (does not affect existing invoices — they snapshot the rate) |
| `deleteTaxRate`     | `taxRateId`         | `void`      | Soft delete (set inactive) — cannot delete if referenced by line items       |
| `setDefaultTaxRate` | `siteId, taxRateId` | `void`      | Set as site default                                                          |

### 8.2 Tax Calculation Service (`tax-calculation-service.ts`)

**Exclusive tax** (most common, Zambia default):

```
line_subtotal = quantity × unit_price - discount
tax_amount = line_subtotal × (tax_rate / 100)
line_total = line_subtotal + tax_amount
```

**Inclusive tax** (price already includes tax):

```
line_total = quantity × unit_price - discount
tax_amount = line_total × (tax_rate / (100 + tax_rate))
line_subtotal = line_total - tax_amount
```

**Compound tax** (tax on tax):

```
base_tax = subtotal × (base_rate / 100)
compound_tax = (subtotal + base_tax) × (compound_rate / 100)
total_tax = base_tax + compound_tax
```

### 8.3 Currency Service (`currency-service.ts`)

| Function                 | Parameters                                | Returns      | Description                                               |
| ------------------------ | ----------------------------------------- | ------------ | --------------------------------------------------------- |
| `getSupportedCurrencies` | none                                      | `Currency[]` | List of supported currencies with symbol + decimal places |
| `getExchangeRate`        | `from, to`                                | `number`     | Current exchange rate (cached, refreshed daily)           |
| `convertAmount`          | `amount, fromCurrency, toCurrency, rate?` | `number`     | Convert amount using specified or current rate            |
| `formatCurrency`         | `amount, currencyCode`                    | `string`     | Format amount for display with correct symbol + decimals  |

**Supported currencies** (initial set — Zambia-first):

- ZMW (Zambian Kwacha) — K symbol, 2 decimals
- USD (US Dollar) — $ symbol, 2 decimals
- GBP (British Pound) — £ symbol, 2 decimals
- EUR (Euro) — € symbol, 2 decimals
- ZAR (South African Rand) — R symbol, 2 decimals
- BWP (Botswana Pula) — P symbol, 2 decimals
- KES (Kenyan Shilling) — KSh symbol, 2 decimals
- NGN (Nigerian Naira) — ₦ symbol, 2 decimals
- TZS (Tanzanian Shilling) — TSh symbol, 0 decimals
- MWK (Malawian Kwacha) — MK symbol, 2 decimals

**Exchange rate source**: Free API (e.g., exchangerate-api.com or frankfurter.app). Cached in `mod_invmod01_settings.metadata.exchange_rates` with `last_updated` timestamp. Refreshed daily via cron or on-demand.

### 8.4 Components

| Component             | File                        | Description                                                                                                      |
| --------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `TaxRateManager`      | `tax-rate-manager.tsx`      | Tax rate CRUD interface — list, create, edit, set default. Shows rate, type (inclusive/exclusive), compound flag |
| `TaxRateSelector`     | (update existing)           | Enhanced with compound tax support and multiple rate selection                                                   |
| `CurrencySelector`    | `currency-selector.tsx`     | Currency dropdown with symbol + exchange rate preview                                                            |
| `ExchangeRateDisplay` | `exchange-rate-display.tsx` | Shows current exchange rate between two currencies with last-updated timestamp                                   |
| `TaxBreakdown`        | `tax-breakdown.tsx`         | Shows per-tax-rate breakdown on invoice totals (e.g., "VAT 16%: K 400.00")                                       |

### 8.5 Invoice Form Modifications

Update the invoice form (from INV-02) to:

- Show currency selector (default from settings)
- Show exchange rate when non-default currency selected
- Per-line-item tax rate selector
- Tax breakdown section in totals area
- Company tax ID fields

### 8.6 Settings Page Enhancement

Add to settings page (from INV-02):

- Tax rate management section
- Default currency selection
- Company tax ID input
- Tax-inclusive vs tax-exclusive default

### INV-08 Deliverables Checklist

- [ ] `tax-actions.ts` — all 5 server action functions
- [ ] `tax-calculation-service.ts` — inclusive, exclusive, compound calculation
- [ ] `currency-service.ts` — conversion, formatting, rate fetching
- [ ] Currency constants with symbols and decimal places
- [ ] All 5 components (+ modifications to existing)
- [ ] Invoice form updated with currency + tax enhancements
- [ ] Settings page updated with tax management section
- [ ] Tax breakdown display on invoice detail + PDF
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-09: Client Portal — Invoice Viewing, Online Payment & Statements

### Purpose

Build the client-facing portal experience for invoicing — clients can view their invoices, download PDFs, see payment history, make online payments via secure links, and view/download statements of account. This is critical for client self-service and reducing manual follow-up.

### Dependencies

- Phase INV-02 complete (invoices exist with view/payment tokens)
- Phase INV-03 complete (payments exist)
- Phase INV-05 complete (credit notes exist)

### Estimated Complexity

MEDIUM-HIGH — ~15 new files (portal pages + public-facing payment flow)

### 9.1 Server Actions (`statement-actions.ts`)

| Function               | Parameters                                | Returns                                        | Description                                                                      |
| ---------------------- | ----------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| `getClientStatement`   | `siteId, contactId, dateRange?`           | `ClientStatement`                              | Statement of account: all invoices, payments, credits for a client within period |
| `getClientBalance`     | `siteId, contactId`                       | `ClientBalance`                                | Total invoiced, paid, credits, outstanding for a client                          |
| `getPortalInvoices`    | `siteId, clientId, filters?, pagination?` | `{ invoices: Invoice[], total: number }`       | Client portal: invoices for this client's contacts                               |
| `getPortalPayments`    | `siteId, clientId, pagination?`           | `{ payments: Payment[], total: number }`       | Client portal: payments for this client                                          |
| `getPortalCreditNotes` | `siteId, clientId, pagination?`           | `{ creditNotes: CreditNote[], total: number }` | Client portal: credit notes for this client                                      |

### 9.2 Client Statement Shape

```typescript
interface ClientStatement {
  client: { name: string; email: string; address: string };
  period: { start: string; end: string };
  openingBalance: number; // in CENTS
  transactions: {
    date: string;
    type: "invoice" | "payment" | "credit";
    reference: string; // Invoice/payment/credit number
    description: string;
    debit: number; // Amounts owed (invoices) in CENTS
    credit: number; // Amounts received (payments, credits) in CENTS
    balance: number; // Running balance in CENTS
  }[];
  closingBalance: number; // in CENTS
  totalInvoiced: number;
  totalPaid: number;
  totalCredits: number;
}
```

### 9.3 Public Invoice View Page

**Route**: `/api/invoicing/view/[token]` (already defined in INV-02)

**Enhanced in this phase**:

- Full branded invoice view (company logo, colors from settings)
- Line items table
- Payment status + amount due
- "Pay Now" button (if online_payment_enabled and amount_due > 0)
- Payment history on this invoice
- Download PDF button
- Mobile-responsive layout

### 9.4 Online Payment Flow

**Route**: `/api/invoicing/pay/[token]`

For this initial version, online payments are handled via a "manual" flow:

1. Client clicks "Pay Now" on public invoice
2. Shown payment instructions (bank transfer details, mobile money numbers from settings)
3. Client enters payment reference and uploads proof
4. Creates a PENDING payment record
5. Agency reviews and approves/rejects pending payments
6. On approval: payment is confirmed, invoice updated

**Future**: Direct payment gateway integration (Stripe, PayPal, etc.) can be added as a later enhancement.

### 9.5 Portal Components

| Component               | File                          | Description                                                                                          |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `PortalInvoiceList`     | `portal-invoice-list.tsx`     | Client portal invoice list — number, date, due date, amount, status badge. Search + status filter    |
| `PortalInvoiceDetail`   | `portal-invoice-detail.tsx`   | Client portal invoice view — line items, totals, payments, download PDF button, pay button           |
| `PortalPaymentHistory`  | `portal-payment-history.tsx`  | Client portal payment list — date, amount, method, invoice reference                                 |
| `PortalStatement`       | `portal-statement.tsx`        | Statement of account — transaction table with running balance, date range selector, download PDF/CSV |
| `PortalCreditNotes`     | `portal-credit-notes.tsx`     | Client portal credit note list                                                                       |
| `PublicInvoiceView`     | `public-invoice-view.tsx`     | Public-facing invoice view (no auth, token-based) — branded, responsive                              |
| `PublicPaymentForm`     | `public-payment-form.tsx`     | Public payment form — enter reference, upload proof                                                  |
| `PortalInvoiceOverview` | `portal-invoice-overview.tsx` | Portal landing — outstanding balance, recent invoices, quick actions                                 |

### 9.6 Portal Pages

| Route                                                    | Page       | Description                            |
| -------------------------------------------------------- | ---------- | -------------------------------------- |
| `/portal/sites/[siteId]/invoicing/`                      | `page.tsx` | Invoice overview (outstanding, recent) |
| `/portal/sites/[siteId]/invoicing/invoices/`             | `page.tsx` | Invoice list                           |
| `/portal/sites/[siteId]/invoicing/invoices/[invoiceId]/` | `page.tsx` | Invoice detail + pay action            |
| `/portal/sites/[siteId]/invoicing/payments/`             | `page.tsx` | Payment history                        |
| `/portal/sites/[siteId]/invoicing/credits/`              | `page.tsx` | Credit notes                           |
| `/portal/sites/[siteId]/invoicing/statements/`           | `page.tsx` | Statement of account                   |

### 9.7 API Routes

| Route                            | Method   | Description                                                   |
| -------------------------------- | -------- | ------------------------------------------------------------- |
| `/api/invoicing/pay/[token]`     | GET/POST | Public payment page (GET = view, POST = submit payment proof) |
| `/api/invoicing/receipt/[token]` | GET      | Payment receipt view                                          |

### INV-09 Deliverables Checklist

- [ ] `statement-actions.ts` — all 5 server action functions
- [ ] Client statement generation with running balance
- [ ] Public invoice view page (branded, responsive)
- [ ] Public payment form (reference + proof upload)
- [ ] Pending payment review workflow for agency
- [ ] All 8 components
- [ ] All 6 portal pages
- [ ] 2 API routes
- [ ] Statement PDF/CSV download
- [ ] Portal navigation wiring (gated by `can_manage_invoices`)
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-10: Email Notifications, Reminders & Overdue Management

### Purpose

Build the email notification system for invoicing — invoice sent emails, payment receipt emails, overdue reminders on configurable schedules, and late fee application. Includes the overdue detection cron job and integration with the automation engine for custom reminder workflows.

### Dependencies

- Phase INV-02 complete (invoice sending exists)
- Phase INV-03 complete (payment recording exists)
- Phase INV-04 complete (recurring engine pattern can be followed for cron)

### Estimated Complexity

MEDIUM — ~10 new files + modifications to existing

### 10.1 Overdue Detection Service (`overdue-service.ts`)

**Cron endpoint**: `/api/invoicing/overdue/check` — called daily via Vercel Cron.

**Processing logic:**

```
1. Query all invoices where:
   - status IN ('sent', 'viewed', 'partial')
   - due_date < today
   - status != 'overdue' OR reminder is due
2. For newly overdue invoices (status not yet 'overdue'):
   a. Update status to 'overdue'
   b. Log activity: "marked_overdue"
   c. Fire event: accounting.invoice.overdue
3. For invoices needing reminders (check overdue_reminder_schedule):
   a. Calculate days overdue
   b. Check if next reminder threshold is reached (e.g., 7, 14, 30 days)
   c. If threshold reached and reminder not yet sent for this threshold:
      - Send overdue reminder email
      - Update last_reminder_sent_at
      - Increment reminder_count
      - Log activity: "overdue_reminder_sent"
4. For invoices needing late fees (check late_fee settings):
   a. If late_fee_enabled and days_overdue > late_fee_grace_days
   b. And late_fee_amount > 0 and late_fee_applied_at IS NULL
   c. Apply late fee: update invoice totals (add late_fee_amount to total and amount_due)
   d. Log activity: "late_fee_applied"
```

### 10.2 Vercel Cron Configuration

Add to `vercel.json` (alongside recurring invoices cron):

```json
{
  "crons": [
    {
      "path": "/api/invoicing/recurring/process",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/invoicing/overdue/check",
      "schedule": "0 7 * * *"
    }
  ]
}
```

Runs daily at 07:00 UTC (09:00 Lusaka time), after recurring invoice generation.

### 10.3 Email Templates

**Invoice Sent Email** (enhance from INV-02):

- Subject: "Invoice {{invoice_number}} from {{company_name}}"
- Body: Amount due, due date, line items summary, "View Invoice" CTA button
- Branding: company logo, colors from settings

**Payment Receipt Email**:

- Subject: "Payment Received — {{invoice_number}}"
- Body: Amount paid, payment method, remaining balance (if partial), "View Invoice" CTA
- Sent automatically when payment is recorded

**Overdue Reminder Email** (3 tiers of urgency):

- **Day 7**: Friendly reminder — "Your invoice is past due"
- **Day 14**: Firmer reminder — "Your invoice is now 14 days overdue"
- **Day 30+**: Urgent — "Immediate payment required — {{invoice_number}} is significantly overdue"
- All include: invoice number, amount due, original due date, days overdue, "Pay Now" CTA

**Late Fee Notice Email**:

- Subject: "Late Fee Applied — {{invoice_number}}"
- Body: Late fee amount, new total, payment instructions

### 10.4 Automation Integration

The overdue detection service fires automation events that the Automation Module picks up:

| Event                          | Data Payload                                                        | Use Cases                                                |
| ------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------- |
| `accounting.invoice.overdue`   | `{ invoiceId, invoiceNumber, contactId, amount_due, days_overdue }` | Trigger custom overdue workflow (escalation, SMS, Slack) |
| `accounting.invoice.cancelled` | `{ invoiceId, invoiceNumber, reason }`                              | Trigger cleanup workflow                                 |

**Pre-built Automation Templates** (added to system-templates.ts):

1. **Invoice Overdue Reminder**: Trigger: `accounting.invoice.overdue` → Wait 1 day → Send email reminder → Wait 7 days → If still unpaid → Send firmer reminder → Wait 14 days → Notify agency owner
2. **Payment Confirmation**: Trigger: `accounting.payment.received` → Send receipt email → If fully paid → Update CRM contact tag "Active Client"
3. **Recurring Invoice Generated**: Trigger: `accounting.invoice.created` (where source=recurring) → Log activity → If auto_send → Send invoice
4. **New Client Invoice**: Trigger: `accounting.invoice.sent` → Wait 3 days → If not viewed → Send follow-up email

### 10.5 API Routes

| Route                          | Method | Description                                                |
| ------------------------------ | ------ | ---------------------------------------------------------- |
| `/api/invoicing/overdue/check` | GET    | Cron endpoint — detects overdue invoices + sends reminders |

### INV-10 Deliverables Checklist

- [ ] `overdue-service.ts` — overdue detection, reminder scheduling, late fee application
- [ ] Overdue cron API route
- [ ] Vercel cron configuration updated
- [ ] 4 email templates (invoice sent, payment receipt, overdue reminder × 3 tiers, late fee notice)
- [ ] Email template rendering using Resend with branding
- [ ] Late fee calculation and application logic
- [ ] 4 automation system templates added to `system-templates.ts`
- [ ] Automation events activated in `event-types.ts` (replace EM-55 stubs with real implementations)
- [ ] Activity logging for all notification actions
- [ ] Settings page: overdue reminder schedule configuration
- [ ] Settings page: late fee configuration
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-11: AI Financial Intelligence & Insights

### Purpose

Leverage the platform's AI capabilities (Claude Sonnet 4.6 and Haiku 4.5) to provide intelligent financial insights — cash flow predictions, payment behavior analysis, invoice optimization suggestions, smart categorization, and natural language financial queries. This transforms the invoicing module from a record-keeping tool into a proactive financial advisor.

### Dependencies

- Phase INV-07 complete (financial reports exist for AI to analyze)
- Phase INV-10 complete (overdue + payment history provides behavioral data)

### Estimated Complexity

MEDIUM — ~8 new files

### 11.1 AI Model Selection

| Task                        | Model             | Rationale                                                   |
| --------------------------- | ----------------- | ----------------------------------------------------------- |
| Cash flow prediction        | Claude Sonnet 4.6 | Complex analysis requiring reasoning about payment patterns |
| Invoice content suggestions | Claude Haiku 4.5  | Fast, simple text generation (descriptions, terms)          |
| Expense categorization      | Claude Haiku 4.5  | Quick classification task                                   |
| Financial Q&A               | Claude Sonnet 4.6 | Requires understanding financial context                    |
| Client risk scoring         | Claude Sonnet 4.6 | Multi-factor analysis                                       |

### 11.2 Server Actions (`ai-actions.ts`)

| Function                      | Parameters                                    | Returns                          | Description                                                                                              |
| ----------------------------- | --------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `getCashFlowForecast`         | `siteId, months?: number`                     | `CashFlowForecast`               | Predicts cash flow for next N months using recurring invoices + payment history patterns                 |
| `getPaymentPrediction`        | `invoiceId`                                   | `PaymentPrediction`              | Predicts when this invoice will be paid based on client's payment history                                |
| `getClientRiskScore`          | `siteId, contactId`                           | `ClientRiskScore`                | Risk assessment: on-time %, average days to pay, total overdue history, risk rating (low/medium/high)    |
| `suggestInvoiceOptimizations` | `siteId`                                      | `Optimization[]`                 | AI-generated suggestions: adjust payment terms, offer early payment discounts, clients to follow up with |
| `categorizeExpense`           | `description, amount`                         | `{ categoryId, confidence }`     | Auto-suggest expense category based on description using AI                                              |
| `askFinancialQuestion`        | `siteId, question: string`                    | `{ answer: string, data?: any }` | Natural language query: "What was my revenue last quarter?" → answer + chart data                        |
| `generateInvoiceDescription`  | `context: { itemName, clientType, quantity }` | `string`                         | AI-generated professional line item description                                                          |
| `getFinancialSummary`         | `siteId, period`                              | `string`                         | AI-generated natural language summary of financial health                                                |

### 11.3 Cash Flow Forecast Shape

```typescript
interface CashFlowForecast {
  months: {
    month: string; // "2026-03"
    predictedIncome: number; // in CENTS
    predictedExpenses: number; // in CENTS
    predictedNetCash: number; // in CENTS
    confidence: number; // 0-1 percentage
    factors: string[]; // ["3 recurring invoices due", "Seasonal pattern: lower collections"]
  }[];
  summary: string; // AI-generated summary paragraph
  alerts: string[]; // e.g., "Cash shortfall predicted in April — consider following up on 5 overdue invoices"
}
```

### 11.4 Client Risk Score Shape

```typescript
interface ClientRiskScore {
  contactId: string;
  clientName: string;
  riskRating: "low" | "medium" | "high";
  score: number; // 0-100 (100 = highest risk)
  factors: {
    averageDaysToPay: number;
    onTimePaymentRate: number; // percentage
    totalInvoiced: number; // in CENTS
    totalOverdue: number; // in CENTS
    overdueCount: number;
    longestOverdueDays: number;
  };
  recommendation: string; // AI-generated: "Consider requiring upfront payment for this client"
}
```

### 11.5 AI Prompt Patterns

**Cash Flow Forecast prompt** (sent to Claude Sonnet):

```
You are a financial analyst for a small/medium business. Based on the following data, predict cash flow for the next {months} months:

Historical monthly revenue (last 12 months): {data}
Recurring invoices schedule: {data}
Outstanding invoices and expected payment dates: {data}
Monthly expense averages by category: {data}
Seasonal patterns observed: {data}

Provide predictions in structured JSON format with confidence scores and human-readable factor explanations.
```

**Financial Q&A prompt**:

```
You are a financial assistant for a business. Answer the following question using ONLY the provided financial data. If the data doesn't support a complete answer, say so.

Financial data context:
{serialized summary data — revenue, expenses, outstanding, client list}

Question: {user's question}

Answer in clear, concise language. Include specific numbers. If the question implies a chart, include chart data in the response.
```

### 11.6 Components

| Component               | File                           | Description                                                                          |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| `AiInsightsPanel`       | `ai-insights-panel.tsx`        | Dashboard widget: top 3 AI insights/alerts with dismiss/action buttons               |
| `CashFlowForecastChart` | `cash-flow-forecast-chart.tsx` | Line chart showing predicted income/expenses for future months with confidence bands |
| `ClientRiskBadge`       | `client-risk-badge.tsx`        | Small badge (green/yellow/red) on invoice/client views showing risk level            |
| `FinancialChatbox`      | `financial-chatbox.tsx`        | Text input for natural language financial queries — shows answer + optional chart    |
| `SmartCategorizer`      | `smart-categorizer.tsx`        | Auto-suggest dropdown for expense category with AI confidence indicator              |
| `InvoiceSuggestions`    | `invoice-suggestions.tsx`      | Optimization suggestions list on dashboard with action buttons                       |

### 11.7 Pages

| Route                  | Page       | Description                                                            |
| ---------------------- | ---------- | ---------------------------------------------------------------------- |
| `/invoicing/insights/` | `page.tsx` | AI insights hub — forecast, risk overview, suggestions, financial chat |

### INV-11 Deliverables Checklist

- [ ] `ai-actions.ts` — all 8 AI server action functions
- [ ] Cash flow forecasting engine with Claude Sonnet integration
- [ ] Client risk scoring algorithm
- [ ] Expense auto-categorization with Haiku
- [ ] Financial natural language Q&A interface
- [ ] AI prompt templates for all use cases
- [ ] All 6 components
- [ ] AI insights page
- [ ] Dashboard widgets integration
- [ ] Rate limiting on AI calls (prevent abuse — max 50 queries/day/site)
- [ ] Caching of AI results (forecast cached 24h, risk scores cached 1h)
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-12: Super Admin Controls & Platform-Level Configuration

### Purpose

Build super admin views for managing invoicing across all sites on the platform — global settings, usage analytics, feature flags, and platform-level overrides. This gives DRAMAC platform administrators visibility into how the invoicing module is used across all agency sites.

### Dependencies

- Phase INV-01+ complete (module exists across sites)

### Estimated Complexity

LOW — ~6 new files

### 12.1 Server Actions (`admin-actions.ts`)

| Function                        | Parameters             | Returns                                             | Description                                                                                     |
| ------------------------------- | ---------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `getInvoicingPlatformStats`     | `dateRange?`           | `PlatformInvoicingStats`                            | Aggregate: total invoices created, total revenue processed, active sites, average invoices/site |
| `getInvoicingSiteOverview`      | `pagination?, sortBy?` | `{ sites: SiteInvoicingOverview[], total: number }` | Per-site overview: site name, invoice count, total revenue, status distribution                 |
| `getInvoicingUsageTrends`       | `period`               | `UsageTrend[]`                                      | Monthly/weekly usage trend across platform                                                      |
| `updateGlobalInvoicingDefaults` | `input`                | `void`                                              | Update platform-wide defaults (default tax rate, currency, payment terms)                       |
| `toggleInvoicingFeature`        | `featureKey, enabled`  | `void`                                              | Enable/disable features globally (e.g., AI insights, multi-currency)                            |

### 12.2 Platform Stats Shape

```typescript
interface PlatformInvoicingStats {
  totalSitesUsingInvoicing: number;
  totalInvoicesCreated: number;
  totalRevenueProcessed: number; // in CENTS (ZMW)
  averageInvoicesPerSite: number;
  invoicesByStatus: Record<string, number>;
  topSitesByRevenue: {
    siteName: string;
    agencyName: string;
    revenue: number;
  }[];
  monthlyGrowthRate: number; // percentage
}
```

### 12.3 Components

| Component                 | File                            | Description                                                          |
| ------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| `AdminInvoicingDashboard` | `admin-invoicing-dashboard.tsx` | Platform-wide stats dashboard — metric cards, site list, usage chart |
| `AdminSiteInvoicingTable` | `admin-site-table.tsx`          | Table of sites with invoicing stats — clickable to drill down        |
| `AdminFeatureFlags`       | `admin-feature-flags.tsx`       | Toggle switches for global invoicing features                        |

### 12.4 Pages

| Route                                | Page       | Description                     |
| ------------------------------------ | ---------- | ------------------------------- |
| `/admin/modules/invoicing/`          | `page.tsx` | Platform invoicing overview     |
| `/admin/modules/invoicing/settings/` | `page.tsx` | Global defaults + feature flags |

### INV-12 Deliverables Checklist

- [ ] `admin-actions.ts` — all 5 server action functions
- [ ] Platform-wide invoice aggregation queries
- [ ] All 3 components
- [ ] 2 admin pages
- [ ] Super admin route protection (permission check)
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-13: Cross-Module Deep Integration

### Purpose

Deep integration between the Invoicing module and all other DRAMAC modules — CRM (contact financial profiles, deal-to-invoice), E-Commerce (order-to-invoice, refund-to-credit-note), Booking (booking-to-invoice, deposit invoicing), Automation (complete event wiring), and Marketing (client segmentation by financial data). This is the "glue" phase that makes the invoicing module a first-class platform citizen.

### Dependencies

- All previous INV phases complete (INV-01 through INV-12)
- Existing modules available: CRM, E-Commerce, Booking, Automation, Marketing

### Estimated Complexity

HIGH — ~20 files (many are modifications to existing module files)

### 13.1 CRM Integration

#### 13.1.1 Contact Financial Profile

**Modify:** `src/modules/crm/components/` — Add financial tab to contact detail page.

| Component           | File                      | Description                                                                                                           |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ContactFinanceTab` | `contact-finance-tab.tsx` | Tab on CRM contact detail: outstanding balance, total invoiced, total paid, invoice list, payment history, risk score |

**Server Actions** (`crm-integration-actions.ts`):

| Function                     | Parameters          | Returns                   | Description                                     |
| ---------------------------- | ------------------- | ------------------------- | ----------------------------------------------- |
| `getContactFinancialProfile` | `contactId`         | `ContactFinancialProfile` | All financial data for a CRM contact            |
| `createInvoiceFromContact`   | `contactId, siteId` | Redirect URL              | Create new invoice pre-filled with contact data |

```typescript
interface ContactFinancialProfile {
  contactId: string;
  totalInvoiced: number; // CENTS
  totalPaid: number; // CENTS
  totalOutstanding: number; // CENTS
  totalCredits: number; // CENTS
  invoiceCount: number;
  averageDaysToPay: number;
  lastInvoiceDate: string | null;
  lastPaymentDate: string | null;
  recentInvoices: Invoice[]; // last 5
  recentPayments: Payment[]; // last 5
  riskRating: "low" | "medium" | "high";
}
```

#### 13.1.2 CRM Deal → Invoice Conversion

When a CRM deal reaches "won" status, allow creating an invoice from the deal:

```
1. User clicks "Create Invoice" on won deal
2. Invoice created with:
   - client_id from deal contact
   - Line items from deal products/services (if any)
   - Amount = deal value
   - Reference to deal ID in metadata
3. Deal updated with linked invoice ID
4. Activity logged on both deal and invoice
```

#### 13.1.3 CRM Contact Tags — Financial Auto-Tagging

Auto-apply CRM contact tags based on financial behavior:

- `High Value Client` — total paid > threshold (configurable)
- `Overdue Account` — has overdue invoices > 30 days
- `Inactive Client` — no invoice in last 6 months
- `Prompt Payer` — 90%+ on-time payment rate
- `Credit Risk` — risk score = high

Tags created as system tags and automatically managed — added/removed by cron job.

### 13.2 E-Commerce Integration

#### 13.2.1 Order → Invoice

When enabled in settings, automatically generate a proper accounting invoice when an e-commerce order is completed:

```
1. E-Commerce order status → 'completed'
2. If invoicing integration enabled in settings:
   a. Create invoice:
      - contact_id = matched from order customer email → CRM contact
      - Line items = order items with quantities, prices, tax
      - Total = order total
      - Status = 'paid' (already paid via e-commerce checkout)
      - metadata = { source: 'ecommerce', order_id: order.id }
   b. Create payment record:
      - amount = order total
      - method = order payment method
      - reference = order number
   c. Update admin metrics (getInvoiceMetrics fills in real data)
3. This invoice exists for ACCOUNTING PURPOSES — not a duplicate of the order receipt
```

#### 13.2.2 E-Commerce Refund → Credit Note

When an e-commerce refund is processed:

```
1. E-Commerce refund processed
2. If linked invoice exists:
   a. Create credit note from the invoice
   b. Amount = refund amount
   c. Auto-apply to the invoice
   d. Status = 'issued'
   e. metadata = { source: 'ecommerce_refund', refund_id: refund.id }
```

**Server Actions** (`ecommerce-integration-actions.ts`):

| Function                     | Parameters            | Returns      | Description                                      |
| ---------------------------- | --------------------- | ------------ | ------------------------------------------------ |
| `createInvoiceFromOrder`     | `orderId, siteId`     | `Invoice`    | Generate accounting invoice from completed order |
| `createCreditNoteFromRefund` | `refundId, invoiceId` | `CreditNote` | Generate credit note from refund                 |

### 13.3 Booking Integration

#### 13.3.1 Booking → Invoice

When a booking is confirmed, optionally generate an invoice:

```
1. Booking confirmed (status = confirmed + payment required)
2. If invoicing integration enabled:
   a. Create invoice:
      - contact_id = booking contact
      - Line items: service name, date/time, price
      - Due date = booking date (or X days before)
      - metadata = { source: 'booking', booking_id: booking.id }
   b. If deposit required:
      - Line item 1: Full service price
      - Discount line: Less deposit already paid
      - Amount due = remaining balance
```

#### 13.3.2 Booking Deposit → Payment

If a booking deposit was paid:

```
1. Link deposit payment to the generated invoice
2. Invoice status = 'partial' (if deposit < total)
```

**Server Actions** (`booking-integration-actions.ts`):

| Function                    | Parameters             | Returns   | Description                                  |
| --------------------------- | ---------------------- | --------- | -------------------------------------------- |
| `createInvoiceFromBooking`  | `bookingId, siteId`    | `Invoice` | Generate invoice from confirmed booking      |
| `linkBookingDepositPayment` | `bookingId, invoiceId` | `Payment` | Record booking deposit as payment on invoice |

### 13.4 Automation Deep Integration

#### 13.4.1 Full Event Registry

Replace ALL EM-55 stubs in `event-types.ts` with real, active event definitions:

| Event Key                            | Category Label | Description                                 |
| ------------------------------------ | -------------- | ------------------------------------------- |
| `accounting.invoice.created`         | Invoicing      | When a new invoice is created               |
| `accounting.invoice.sent`            | Invoicing      | When an invoice is sent to client           |
| `accounting.invoice.viewed`          | Invoicing      | When client views invoice (via public link) |
| `accounting.invoice.paid`            | Invoicing      | When invoice is fully paid                  |
| `accounting.invoice.partial_payment` | Invoicing      | When partial payment recorded               |
| `accounting.invoice.overdue`         | Invoicing      | When invoice becomes overdue                |
| `accounting.invoice.cancelled`       | Invoicing      | When invoice is cancelled/voided            |
| `accounting.payment.received`        | Invoicing      | When any payment is received                |
| `accounting.payment.failed`          | Invoicing      | When payment fails or is rejected           |
| `accounting.payment.refunded`        | Invoicing      | When payment is refunded                    |
| `accounting.expense.created`         | Invoicing      | When expense is recorded                    |
| `accounting.expense.approved`        | Invoicing      | When expense is approved                    |
| `accounting.expense.rejected`        | Invoicing      | When expense is rejected                    |

#### 13.4.2 Event Data Payloads

Each event includes a structured payload for use in automation conditions and actions:

```typescript
// Invoice event payload
interface InvoiceEventPayload {
  invoiceId: string;
  invoiceNumber: string;
  contactId: string;
  clientName: string;
  amount: number; // total in CENTS
  amountDue: number; // remaining in CENTS
  currency: string;
  dueDate: string;
  status: string;
  daysOverdue?: number;
  siteId: string;
}

// Payment event payload
interface PaymentEventPayload {
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  contactId: string;
  amount: number; // in CENTS
  method: string;
  reference: string;
  siteId: string;
}
```

#### 13.4.3 Automation Actions (New)

Add invoicing-specific automation ACTIONS (not just triggers):

| Action Key                       | Description                                    |
| -------------------------------- | ---------------------------------------------- |
| `invoicing.send_invoice`         | Send invoice email to client                   |
| `invoicing.send_reminder`        | Send payment reminder                          |
| `invoicing.apply_late_fee`       | Apply late fee to invoice                      |
| `invoicing.mark_as_written_off`  | Write off invoice                              |
| `invoicing.create_from_template` | Create invoice from saved template for contact |

These actions can be used in automation workflows alongside existing actions (send_email, update_crm_contact, add_tag, etc.)

### 13.5 Marketing Integration

#### 13.5.1 Financial Segmentation

Expose financial data as filter criteria in marketing audience builder:

| Filter Field          | Type    | Description                      |
| --------------------- | ------- | -------------------------------- |
| `total_invoiced`      | Number  | Total amount invoiced to contact |
| `total_paid`          | Number  | Total payments from contact      |
| `outstanding_balance` | Number  | Current outstanding balance      |
| `last_invoice_date`   | Date    | Date of most recent invoice      |
| `last_payment_date`   | Date    | Date of most recent payment      |
| `payment_risk`        | Select  | Risk rating: low, medium, high   |
| `is_active_client`    | Boolean | Has invoice in last 6 months     |

This allows marketing campaigns targeted at financial segments (e.g., "Clients with outstanding balance > K5,000").

### 13.6 Modified Files Summary

| File                                              | Module     | Change                                   |
| ------------------------------------------------- | ---------- | ---------------------------------------- |
| `src/modules/crm/components/contact-detail.tsx`   | CRM        | Add Finance tab                          |
| `src/modules/crm/components/deal-detail.tsx`      | CRM        | Add "Create Invoice" button on won deals |
| `src/modules/automation/data/event-types.ts`      | Automation | Replace EM-55 stubs with real events     |
| `src/modules/automation/data/action-types.ts`     | Automation | Add 5 invoicing actions                  |
| `src/modules/automation/data/system-templates.ts` | Automation | Add 4 invoicing workflow templates       |
| `src/modules/marketing/lib/audience-filters.ts`   | Marketing  | Add financial filter fields              |
| E-Commerce order handler                          | E-Commerce | Add invoice generation hook              |
| Booking confirmation handler                      | Booking    | Add invoice generation hook              |

### INV-13 Deliverables Checklist

- [ ] `crm-integration-actions.ts` — contact financial profile + deal→invoice
- [ ] `ecommerce-integration-actions.ts` — order→invoice, refund→credit note
- [ ] `booking-integration-actions.ts` — booking→invoice, deposit→payment
- [ ] Contact Finance tab component
- [ ] CRM deal "Create Invoice" button + handler
- [ ] CRM auto-tagging cron (financial behavior tags)
- [ ] E-Commerce order → accounting invoice pipeline
- [ ] E-Commerce refund → credit note pipeline
- [ ] Booking → invoice pipeline
- [ ] All 13 automation events activated (replace EM-55 stubs)
- [ ] 5 automation actions registered
- [ ] 4 automation system templates
- [ ] Marketing audience financial filter fields
- [ ] All 8 modified files in other modules
- [ ] Integration toggle switches in invoicing settings
- [ ] Zero TypeScript errors
- [ ] Successful build

---

## Phase INV-14: Vendor Management, Purchase Orders & Bills

### Purpose

Complete the accounts payable side — full vendor management, purchase order creation and tracking, bill management, and bill payments. This closes the loop on financial management, giving agencies control over both their receivables (invoices) and payables (bills). Purchase orders → bills → payments form the expense lifecycle counterpart to quotes → invoices → payments.

### Dependencies

- Phase INV-01 complete (vendors, bills, purchase_orders tables exist)
- Phase INV-06 complete (expenses exist — bills reference expense tracking)

### Estimated Complexity

HIGH — ~20 new files

### 14.1 Server Actions — Vendors (`vendor-actions.ts`)

| Function         | Parameters                      | Returns                                                                            | Description                                                              |
| ---------------- | ------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `getVendors`     | `siteId, filters?, pagination?` | `{ vendors: Vendor[], total: number }`                                             | Paginated vendor list with search, status filter                         |
| `getVendor`      | `vendorId`                      | `Vendor & { bills: Bill[], purchaseOrders: PurchaseOrder[], expenses: Expense[] }` | Full vendor with related records                                         |
| `createVendor`   | `siteId, input`                 | `Vendor`                                                                           | Create vendor: name, email, phone, address, tax ID, payment terms, notes |
| `updateVendor`   | `vendorId, input`               | `Vendor`                                                                           | Update vendor                                                            |
| `deleteVendor`   | `vendorId`                      | `void`                                                                             | Soft delete (cannot delete if has active bills)                          |
| `getVendorStats` | `vendorId`                      | `VendorStats`                                                                      | Summary: total billed, paid, outstanding, avg payment time               |

### 14.2 Server Actions — Purchase Orders (`purchase-order-actions.ts`)

| Function               | Parameters                      | Returns                                              | Description                                             |
| ---------------------- | ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| `getPurchaseOrders`    | `siteId, filters?, pagination?` | `{ purchaseOrders: PurchaseOrder[], total: number }` | Paginated PO list with vendor/status/date filters       |
| `getPurchaseOrder`     | `purchaseOrderId`               | `PurchaseOrder with line items, vendor, bills`       | Full PO with related data                               |
| `createPurchaseOrder`  | `siteId, input`                 | `PurchaseOrder`                                      | Create PO: vendor, line items, expected delivery, notes |
| `updatePurchaseOrder`  | `purchaseOrderId, input`        | `PurchaseOrder`                                      | Update PO (only if draft)                               |
| `deletePurchaseOrder`  | `purchaseOrderId`               | `void`                                               | Delete PO (only if draft)                               |
| `sendPurchaseOrder`    | `purchaseOrderId`               | `void`                                               | Send PO to vendor via email, update status to 'sent'    |
| `approvePurchaseOrder` | `purchaseOrderId`               | `void`                                               | Approve PO (if approval workflow enabled)               |
| `convertToBill`        | `purchaseOrderId`               | `Bill`                                               | Convert received PO to bill                             |
| `markAsReceived`       | `purchaseOrderId`               | `void`                                               | Mark goods/services received                            |
| `cancelPurchaseOrder`  | `purchaseOrderId`               | `void`                                               | Cancel PO                                               |

**PO Number Generation**: `PO-{YYYY}-{sequential}` — follows same atomic pattern as invoice numbers.

### 14.3 Server Actions — Bills (`bill-actions.ts`)

| Function            | Parameters                      | Returns                                              | Description                                                  |
| ------------------- | ------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `getBills`          | `siteId, filters?, pagination?` | `{ bills: Bill[], total: number }`                   | Paginated bill list with vendor/status/date/amount filters   |
| `getBill`           | `billId`                        | `Bill with line items, vendor, payments, activities` | Full bill with related data                                  |
| `createBill`        | `siteId, input`                 | `Bill`                                               | Create bill: vendor, line items, due date, reference         |
| `updateBill`        | `billId, input`                 | `Bill`                                               | Update bill (cannot update if paid)                          |
| `deleteBill`        | `billId`                        | `void`                                               | Delete bill (only if draft, no payments)                     |
| `recordBillPayment` | `billId, input`                 | `void`                                               | Record payment against bill (partial or full)                |
| `voidBill`          | `billId, reason`                | `void`                                               | Void bill — reverse any payments                             |
| `approveBill`       | `billId`                        | `void`                                               | Approve bill for payment                                     |
| `getBillStats`      | `siteId, dateRange?`            | `BillStats`                                          | Summary: total billed, paid, outstanding, overdue, by vendor |

**Bill Number Generation**: `BILL-{YYYY}-{sequential}` — atomic sequential.

### 14.4 Bill Payment Logic

Bills use the same payment pattern as invoices (from INV-03):

```
1. Record payment:
   a. Create payment record linked to bill
   b. Recalculate bill.amount_paid and bill.amount_due
   c. Update bill status:
      - If amount_due = 0 → 'paid', set paid_at
      - If amount_paid > 0 AND amount_due > 0 → 'partial'
      - Else → stays as 'approved'
   d. Log activity
2. Refund bill payment:
   a. Mark payment as refunded
   b. Recalculate bill totals
   c. Revert bill status if needed
```

### 14.5 Accounts Payable Dashboard Integration

Add to the financial dashboard (INV-07):

```typescript
// Extended DashboardMetrics
interface DashboardMetrics {
  // ... existing receivable metrics
  // New payable metrics:
  totalBillsOutstanding: number; // in CENTS
  totalBillsOverdue: number; // in CENTS
  totalBillsPaid: number; // in CENTS (period)
  totalPurchaseOrders: number; // count of active POs
  netCashPosition: number; // receivables - payables
}
```

### 14.6 Components — Vendors

| Component      | File                | Description                                                                                |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| `VendorList`   | `vendor-list.tsx`   | Paginated vendor table — name, email, total billed, outstanding, status. Search + filter   |
| `VendorForm`   | `vendor-form.tsx`   | Create/edit form — name, email, phone, address, tax ID, payment terms, bank details, notes |
| `VendorDetail` | `vendor-detail.tsx` | Vendor profile — info card, tabs for Bills, POs, Expenses, Activity                        |

### 14.7 Components — Purchase Orders

| Component             | File                        | Description                                                                                              |
| --------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `PurchaseOrderList`   | `purchase-order-list.tsx`   | Paginated PO table — PO number, vendor, total, status, date. Filters                                     |
| `PurchaseOrderForm`   | `purchase-order-form.tsx`   | Create/edit PO — vendor select, line items (description, qty, unit price, tax), expected delivery, notes |
| `PurchaseOrderDetail` | `purchase-order-detail.tsx` | Full PO view — line items, totals, status timeline, actions (send, approve, receive, convert to bill)    |
| `PurchaseOrderPdf`    | `purchase-order-pdf.tsx`    | Print-friendly PO view for PDF generation (follows invoice PDF pattern)                                  |

### 14.8 Components — Bills

| Component           | File                      | Description                                                                                   |
| ------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| `BillList`          | `bill-list.tsx`           | Paginated bill table — bill number, vendor, amount, due date, status, amount_due. Filters     |
| `BillForm`          | `bill-form.tsx`           | Create/edit bill — vendor, reference, line items, due date, notes. Similar to invoice form    |
| `BillDetail`        | `bill-detail.tsx`         | Full bill view — line items, totals, payment history, linked PO, actions (approve, pay, void) |
| `BillPaymentDialog` | `bill-payment-dialog.tsx` | Payment recording dialog — amount, method, reference, date (mirrors invoice payment dialog)   |

### 14.9 Pages

| Route                                | Page       | Description         |
| ------------------------------------ | ---------- | ------------------- |
| `/invoicing/vendors/`                | `page.tsx` | Vendor list         |
| `/invoicing/vendors/new/`            | `page.tsx` | Create vendor       |
| `/invoicing/vendors/[vendorId]/`     | `page.tsx` | Vendor detail       |
| `/invoicing/purchase-orders/`        | `page.tsx` | Purchase order list |
| `/invoicing/purchase-orders/new/`    | `page.tsx` | Create PO           |
| `/invoicing/purchase-orders/[poId]/` | `page.tsx` | PO detail           |
| `/invoicing/bills/`                  | `page.tsx` | Bill list           |
| `/invoicing/bills/new/`              | `page.tsx` | Create bill         |
| `/invoicing/bills/[billId]/`         | `page.tsx` | Bill detail         |

### 14.10 Automation Events

| Event                                | When                      |
| ------------------------------------ | ------------------------- |
| `accounting.bill.created`            | Bill recorded             |
| `accounting.bill.approved`           | Bill approved for payment |
| `accounting.bill.paid`               | Bill fully paid           |
| `accounting.bill.overdue`            | Bill past due date        |
| `accounting.purchase_order.created`  | PO created                |
| `accounting.purchase_order.sent`     | PO sent to vendor         |
| `accounting.purchase_order.received` | Goods/services received   |

### INV-14 Deliverables Checklist

- [ ] `vendor-actions.ts` — all 6 vendor server actions
- [ ] `purchase-order-actions.ts` — all 10 PO server actions
- [ ] `bill-actions.ts` — all 9 bill server actions
- [ ] PO number generation (atomic, sequential)
- [ ] Bill number generation (atomic, sequential)
- [ ] PO → Bill conversion logic
- [ ] Bill payment recording + status management
- [ ] All 3 vendor components
- [ ] All 4 purchase order components
- [ ] All 4 bill components
- [ ] All 9 dashboard pages
- [ ] PO PDF generation (follows invoice PDF pattern)
- [ ] PO email sending to vendor
- [ ] Dashboard metrics extended with payable data
- [ ] Financial reports extended (P&L includes bills, cash flow includes payables)
- [ ] 7 automation events registered
- [ ] Navigation entries for vendors, POs, bills
- [ ] Zero TypeScript errors
- [ ] Successful build

---

# Section 5: Implementation Notes & Quality Standards

## Code Quality Rules

1. **ALL amounts in CENTS** — integers only, never floating point for money
2. **ALL database timestamps** — use `timestamptz` with default `now()`
3. **ALL server actions** — use `"use server"` directive, validate inputs via Zod
4. **ALL components** — typed props with `interface`, use existing design system components (Button, Card, Badge, Table from `@/components/ui/`)
5. **ALL forms** — use React Hook Form + Zod resolver (follows platform pattern)
6. **ALL lists** — paginated with `usePagination` hook, filterable
7. **ALL status changes** — logged in `mod_invmod01_invoice_activity` table
8. **ALL RLS policies** — site_id based, use `get_user_site_role()` helper
9. **ALL emails** — sent via Resend, from `Dramac <noreply@app.dramacagency.com>`
10. **ALL AI calls** — rate limited, cached where appropriate, graceful fallback on failure
11. **NEVER** use `DELETE FROM` — always soft delete or `UPDATE status`
12. **NEVER** store money as `numeric` or `float` — use `integer` (cents)
13. **NEVER** trust client-side totals — always recalculate on server
14. **FOLLOW** existing patterns: check CRM, Booking, E-Commerce, Marketing modules for reference implementations

## File Naming Convention

```
Server Actions:     [entity]-actions.ts (e.g., invoice-actions.ts)
Services:           [entity]-service.ts (e.g., pdf-service.ts)
Components:         [component-name].tsx (kebab-case, e.g., invoice-list.tsx)
Pages:              page.tsx (in route directories)
Types:              [entity].ts in types/ directory
Constants:          constants.ts in lib/ directory
Hooks:              use-[name].ts (e.g., use-invoice-filters.ts)
```

## Testing Strategy

Each phase should include:

- Server action tests with mock Supabase client
- Component rendering tests for key components
- Integration tests for critical flows (create invoice → send → pay)
- E2E tests for complete user journeys

## Performance Targets

- Invoice list page load: < 1.5s (paginated, 25 per page)
- Invoice PDF generation: < 3s
- Dashboard load: < 2s (aggregate queries optimized)
- AI insight generation: < 5s (with loading state)

---

# End of PHASE-INV-MASTER-GUIDE.md

**Total Phases**: 14
**Estimated Files**: 150+
**Estimated Database Tables**: 18
**Estimated Server Actions**: 100+
**Estimated Components**: 90+
**Estimated Pages**: 45+

This document is the SINGLE SOURCE OF TRUTH for building the DRAMAC Invoicing & Financial Management module. Every AI agent session MUST read this document before implementing any phase.
