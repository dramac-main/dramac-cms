# AI AGENT PROMPT: Generate WAVE 2 E-Commerce Phase Documents

---

## YOUR TASK

You are a senior software architect creating detailed PHASE implementation documents for the DRAMAC CMS E-Commerce Module. Your job is to generate **WAVE 2: Quotation System** - consisting of **4 comprehensive PHASE documents** that another AI agent will use to implement the code.

**IMPORTANT**: Wave 1 (Dashboard Foundation) has been completed. The following already exists:
- ECOM-01 ✅ Dashboard Redesign & Navigation (sidebar, widgets, command palette)
- ECOM-02 ✅ Product Management Enhancement (TanStack Table, filters, bulk actions, import/export)
- ECOM-03 ✅ Settings & Configuration Center (9 settings tabs, server actions)
- ECOM-04 ✅ Order Management Enhancement (order detail dialog, timeline, refunds, invoices)
- ECOM-05 ✅ Customer Management (customer list, detail dialog, groups, notes)

---

## PHASES TO CREATE

Generate the following 4 PHASE documents:

| Phase | Title | Priority | Est. Hours |
|-------|-------|----------|------------|
| **PHASE-ECOM-10** | Quotation Database Schema & Types | 🔴 CRITICAL | 4-5 |
| **PHASE-ECOM-11** | Quote Builder & Management | 🔴 CRITICAL | 10-12 |
| **PHASE-ECOM-12** | Quote Workflow & Customer Portal | 🟠 HIGH | 8-10 |
| **PHASE-ECOM-13** | Quote Templates & Automation | 🟠 HIGH | 6-8 |

---

## EXISTING CODE CONTEXT

### Current E-Commerce Module Structure (After Wave 1)
```
src/modules/ecommerce/
├── actions/
│   ├── customer-actions.ts      # ✅ Customer CRUD (873 lines)
│   ├── dashboard-actions.ts     # ✅ Dashboard stats & search
│   ├── ecommerce-actions.ts     # ✅ Products, orders, categories, cart
│   ├── order-actions.ts         # ✅ Order management (500+ lines)
│   ├── product-import-export.ts # ✅ Import/export/bulk ops
│   └── settings-actions.ts      # ✅ Settings CRUD
├── components/
│   ├── bulk/                    # ✅ Bulk actions toolbar
│   ├── customers/               # ✅ Customer table, detail dialog
│   ├── dialogs/                 # ✅ Product, order, import dialogs
│   ├── filters/                 # ✅ Product filters
│   ├── layout/                  # ✅ Sidebar, header
│   ├── orders/                  # ✅ Order detail, timeline, refund
│   ├── settings/                # ✅ 9 settings components
│   ├── tables/                  # ✅ Product data table
│   ├── views/                   # ✅ Home, products, orders, customers, categories, discounts, analytics, settings
│   ├── widgets/                 # ✅ Stats cards, recent orders, low stock, activity
│   ├── command-palette.tsx      # ✅ Cmd+K search
│   └── ecommerce-dashboard.tsx  # ✅ Main dashboard with sidebar
├── lib/
│   └── settings-utils.ts        # ✅ Pure utility functions
├── types/
│   └── ecommerce-types.ts       # ✅ All types (1200+ lines)
└── context/
    └── ecommerce-context.tsx    # ✅ Provider pattern
```

### Navigation Already Configured for Quotes
The sidebar, header, and command palette already have "Quotes" navigation items:
- Sidebar: `{ id: 'quotes', label: 'Quotes', icon: FileText }`
- Header breadcrumb: `quotes: 'Quotes'`
- Command palette: `{ id: 'quotes', label: 'Quotes', icon: FileText, keywords: ['quotations', 'rfq'] }`
- Dashboard: `{activeView === 'quotes' && (...)` placeholder exists

### Existing Types Reference
The `ecommerce-types.ts` file has 1216 lines with all existing types. New quote types should follow the same patterns.

---

## DOCUMENT FORMAT REQUIREMENTS

Each PHASE document MUST follow this EXACT structure:

```markdown
# PHASE-ECOM-XX: [Phase Title]

> **Priority**: 🔴 CRITICAL | 🟠 HIGH
> **Estimated Time**: X-Y hours
> **Prerequisites**: [List any prior phases]
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

[2-3 sentences describing what this phase accomplishes]

---

## 📋 Pre-Implementation Checklist

- [ ] Read memory bank files (`/memory-bank/*.md`)
- [ ] Review existing e-commerce module code (`src/modules/ecommerce/`)
- [ ] Verify Wave 1 phases (ECOM-01 to ECOM-05) are complete
- [ ] No TypeScript errors: `npx tsc --noEmit`

---

## 🏗️ Architecture Overview

[Diagram or description of how this phase fits into the module]

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `path/to/file.tsx` | Create/Modify | Description |

---

## 📋 Implementation Tasks

### Task X.1: [Task Name]

**File**: `src/modules/ecommerce/path/to/file.tsx`
**Action**: Create | Modify

**Description**: [What this task accomplishes]

```typescript
// COMPLETE implementation code here
// Include ALL imports
// Include ALL TypeScript types
// Include inline comments explaining logic
// This must be copy-paste ready
```

### Task X.2: [Next Task]
[Continue with complete code for each task]

---

## 🗄️ Database Migrations (if needed)

**File**: `migrations/ecom-XX-description.sql`

```sql
-- Complete SQL migration
-- Include comments
-- Include indexes
-- Include RLS policies
```

---

## 🔧 Type Definitions

**File**: `src/modules/ecommerce/types/ecommerce-types.ts`

```typescript
// New or modified type definitions
```

---

## ✅ Testing Checklist

- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] No ESLint errors
- [ ] [Specific manual test 1]
- [ ] [Specific manual test 2]
- [ ] Mobile responsive check (Chrome DevTools)

---

## 🔄 Rollback Plan

If issues occur:
1. [Step to revert change 1]
2. [Step to revert change 2]
3. Run `npx tsc --noEmit` to verify clean state

---

## 📝 Memory Bank Updates

After completion, update these files:
- `activeContext.md`: Add phase completion note
- `progress.md`: Update e-commerce section

---

## ✨ Success Criteria

- [ ] [Specific measurable outcome 1]
- [ ] [Specific measurable outcome 2]
- [ ] [Specific measurable outcome 3]
```

---

## CRITICAL REQUIREMENTS FOR ALL PHASES

### 1. Complete, Copy-Paste Ready Code
- Every code block must be COMPLETE - no placeholders like `// ... rest of code`
- Include ALL imports at the top
- Include ALL TypeScript interfaces/types
- Include inline comments explaining complex logic

### 2. Follow Existing Patterns
Study the existing e-commerce code and match these patterns exactly:
- **Server Actions**: Use `'use server'` directive, NOT classes
- **Utility Functions**: Put in `lib/` folder WITHOUT `'use server'` (see `settings-utils.ts`)
- **Table Prefix**: `mod_ecommod01_` for all database tables
- **Component Pattern**: Match existing dialogs in `components/dialogs/`
- **Table Pattern**: Match existing tables in `components/tables/`
- **View Pattern**: Match existing views in `components/views/`

### 3. Mobile-First Responsive
- All components must work on mobile first
- Use Tailwind responsive classes (`md:`, `lg:`)
- Touch-friendly interactions (min 44px tap targets)

### 4. TypeScript Strict Mode
- All types must be explicitly defined
- No `any` types unless absolutely necessary
- Export types for reuse

### 5. Reference Existing Code
- `order-actions.ts` - Good pattern for complex server actions
- `order-detail-dialog.tsx` - Good pattern for detail dialogs with tabs
- `customer-table.tsx` - Good pattern for data tables
- `product-filters.tsx` - Good pattern for filtering

---

## WAVE 2 PHASE DETAILS

### PHASE-ECOM-10: Quotation Database Schema & Types

**Must Include:**

**Database Tables:**
```sql
-- Quotes table
CREATE TABLE mod_ecommod01_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  quote_number TEXT NOT NULL,
  reference_number TEXT, -- Optional customer reference
  
  -- Customer info (can be existing or new)
  customer_id UUID REFERENCES mod_ecommod01_customers(id),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_company TEXT,
  customer_phone TEXT,
  
  -- Addresses
  billing_address JSONB,
  shipping_address JSONB,
  
  -- Status flow
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'sent', 'viewed', 'accepted', 
    'rejected', 'expired', 'converted', 'cancelled'
  )),
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Content
  title TEXT,
  introduction TEXT,
  terms_and_conditions TEXT,
  notes_to_customer TEXT,
  internal_notes TEXT,
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  responded_at TIMESTAMPTZ,
  response_notes TEXT,
  
  -- Conversion
  converted_to_order_id UUID REFERENCES mod_ecommod01_orders(id),
  converted_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, quote_number)
);

-- Quote items
CREATE TABLE mod_ecommod01_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES mod_ecommod01_quotes(id) ON DELETE CASCADE,
  
  -- Product reference (optional - can be custom line item)
  product_id UUID REFERENCES mod_ecommod01_products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES mod_ecommod01_product_variants(id) ON DELETE SET NULL,
  
  -- Item details (snapshot at time of quote)
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  image_url TEXT,
  
  -- Pricing
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Options
  options JSONB DEFAULT '{}',
  
  -- Sorting
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote activity log
CREATE TABLE mod_ecommod01_quote_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES mod_ecommod01_quotes(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created', 'updated', 'sent', 'viewed', 'accepted', 'rejected',
    'expired', 'converted', 'cancelled', 'note_added', 'reminder_sent',
    'item_added', 'item_removed', 'item_updated', 'status_changed'
  )),
  
  description TEXT NOT NULL,
  performed_by UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote templates
CREATE TABLE mod_ecommod01_quote_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Default content
  default_title TEXT,
  default_introduction TEXT,
  default_terms TEXT,
  default_notes TEXT,
  default_validity_days INTEGER DEFAULT 30,
  
  -- Default items (can be pre-filled)
  items JSONB DEFAULT '[]',
  
  -- Settings
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**TypeScript Types to Add (in ecommerce-types.ts):**
- `QuoteStatus` - Union type for all statuses
- `Quote` - Main quote interface
- `QuoteItem` - Line item interface
- `QuoteActivity` - Activity log interface
- `QuoteTemplate` - Template interface
- `QuoteInput`, `QuoteUpdate` - CRUD types
- `QuoteItemInput`, `QuoteItemUpdate` - Item CRUD types
- `QuoteTableFilters` - Filter interface
- `QuoteDetailData` - Extended quote with relations
- `QuoteSummary` - Summary for list view

**Key Files to Create:**
- `migrations/ecom-10-quotation-schema.sql` (NEW)
- `src/modules/ecommerce/types/ecommerce-types.ts` (MODIFY - add ~200 lines)

---

### PHASE-ECOM-11: Quote Builder & Management

**Must Include:**

**Quotes View (List):**
- Quote list table with columns:
  - Quote number (clickable)
  - Customer name/company
  - Status badge with color coding
  - Total amount
  - Valid until (with expired warning)
  - Created date
  - Actions dropdown
- Advanced filters:
  - Status filter (multi-select)
  - Date range (created, expires)
  - Amount range
  - Customer search
- Bulk actions:
  - Send selected
  - Mark as expired
  - Delete
  - Export to CSV

**Quote Builder Dialog:**
- Multi-step form OR tabbed interface:
  - **Customer**: Select existing or add new customer
  - **Items**: Product selector + custom line items
  - **Pricing**: Discounts, tax, shipping
  - **Content**: Title, intro, terms, notes
  - **Preview**: Full quote preview
- Product selector with search and filters
- Custom line item support (name, description, price, qty)
- Inline editing for quantities and prices
- Discount options (percentage or fixed)
- Tax calculation (auto or manual)
- Validity date picker (default 30 days)
- Auto-save draft functionality
- Quote number auto-generation

**Quote Detail Dialog:**
- Tabs: Details, Items, Activity, Preview
- Customer info panel
- Quote items table with edit capability
- Status change actions
- Activity timeline (like order timeline)
- PDF preview/download
- Send quote button
- Convert to order button

**Server Actions:**
- `createQuote()` - Create new quote
- `updateQuote()` - Update quote
- `deleteQuote()` - Delete quote
- `getQuote()` - Get single quote with items
- `getQuotes()` - List quotes with filters
- `addQuoteItem()` - Add item to quote
- `updateQuoteItem()` - Update item
- `removeQuoteItem()` - Remove item
- `calculateQuoteTotals()` - Recalculate amounts
- `generateQuoteNumber()` - Generate unique number
- `duplicateQuote()` - Clone quote

**Key Files to Create:**
- `src/modules/ecommerce/actions/quote-actions.ts` (NEW - ~800 lines)
- `src/modules/ecommerce/components/views/quotes-view.tsx` (NEW)
- `src/modules/ecommerce/components/quotes/quote-table.tsx` (NEW)
- `src/modules/ecommerce/components/quotes/quote-builder-dialog.tsx` (NEW)
- `src/modules/ecommerce/components/quotes/quote-detail-dialog.tsx` (NEW)
- `src/modules/ecommerce/components/quotes/quote-items-editor.tsx` (NEW)
- `src/modules/ecommerce/components/quotes/quote-timeline.tsx` (NEW)
- `src/modules/ecommerce/components/quotes/product-selector.tsx` (NEW)
- `src/modules/ecommerce/components/quotes/index.ts` (NEW)

---

### PHASE-ECOM-12: Quote Workflow & Customer Portal

**Must Include:**

**Quote Status Workflow:**
- Status transitions with validation:
  - draft → pending_approval, sent
  - pending_approval → sent, cancelled
  - sent → viewed (auto), accepted, rejected, expired
  - viewed → accepted, rejected, expired
  - accepted → converted
  - rejected → (final)
  - expired → (final, can duplicate)
  - converted → (final)
- Auto-expire quotes past valid_until date
- Status change logging

**Send Quote Flow:**
- Send quote via email:
  - Customizable email subject
  - Email body with quote summary
  - Link to customer portal
  - PDF attachment option
- Email template with placeholders
- Send confirmation dialog
- Track sent timestamp
- Re-send option

**Customer Quote Portal:**
- Public quote view page: `/quote/[token]`
- No authentication required (secure token)
- Quote details display:
  - Company branding (logo, colors)
  - Quote number, date, validity
  - Customer info
  - Line items table
  - Terms and conditions
  - Total breakdown
- Accept button (with confirmation)
- Reject button (with reason textarea)
- Download PDF button
- View tracking (IP, timestamp, user agent)
- Expired quote handling
- Mobile-responsive design

**Quote-to-Order Conversion:**
- Convert accepted quote to order:
  - Copy all items
  - Copy customer info
  - Copy addresses
  - Set payment status to pending
  - Link order to quote
- Conversion confirmation dialog
- Post-conversion:
  - Update quote status to converted
  - Log conversion activity
  - Redirect to order detail

**Key Files to Create:**
- `src/modules/ecommerce/actions/quote-workflow-actions.ts` (NEW)
- `src/modules/ecommerce/components/quotes/send-quote-dialog.tsx` (NEW)
- `src/modules/ecommerce/components/quotes/quote-status-badge.tsx` (NEW)
- `src/modules/ecommerce/components/quotes/convert-to-order-dialog.tsx` (NEW)
- `src/app/(public)/quote/[token]/page.tsx` (NEW - customer portal)
- `src/app/(public)/quote/[token]/actions.ts` (NEW - portal actions)
- `src/modules/ecommerce/lib/quote-email-templates.ts` (NEW)
- `src/modules/ecommerce/lib/quote-pdf-generator.ts` (NEW)

---

### PHASE-ECOM-13: Quote Templates & Automation

**Must Include:**

**Quote Templates Management:**
- Template list view
- Create/edit template dialog:
  - Template name
  - Default title
  - Default introduction
  - Default terms
  - Default notes
  - Default validity (days)
  - Pre-filled items (optional)
  - Set as default
- Template preview
- Duplicate template
- Delete template

**Create Quote from Template:**
- "Create from Template" dropdown in quotes view
- Template selection modal
- Auto-populate quote fields from template
- Allow editing after template applied

**Quote Settings:**
- Add to settings view:
  - Quote number format (prefix, counter)
  - Default validity days
  - Default terms and conditions
  - Default currency
  - Auto-expire enabled
  - Reminder emails enabled
  - PDF branding settings

**Automated Features:**
- Quote expiration cron/trigger:
  - Check quotes past valid_until
  - Update status to expired
  - Log activity
  - Optional: Send expiration notice
- Quote reminder system:
  - Reminder at X days before expiry
  - Email template for reminders
  - Track reminder sent

**Server Actions:**
- `createQuoteTemplate()` - Create template
- `updateQuoteTemplate()` - Update template
- `deleteQuoteTemplate()` - Delete template
- `getQuoteTemplates()` - List templates
- `createQuoteFromTemplate()` - Create quote using template
- `getQuoteSettings()` - Get quote-specific settings
- `updateQuoteSettings()` - Update quote settings
- `processExpiredQuotes()` - Batch expire old quotes
- `sendQuoteReminder()` - Send reminder email

**Key Files to Create:**
- `src/modules/ecommerce/actions/quote-template-actions.ts` (NEW)
- `src/modules/ecommerce/components/quotes/template-list.tsx` (NEW)
- `src/modules/ecommerce/components/quotes/template-dialog.tsx` (NEW)
- `src/modules/ecommerce/components/quotes/template-selector.tsx` (NEW)
- `src/modules/ecommerce/components/settings/quote-settings.tsx` (NEW)
- `src/modules/ecommerce/lib/quote-automation.ts` (NEW)

---

## OUTPUT FORMAT

Generate each phase as a SEPARATE document with clear headers. Output them in order:

1. First output `PHASE-ECOM-10-QUOTATION-SCHEMA.md`
2. Then output `PHASE-ECOM-11-QUOTE-BUILDER.md`
3. Then output `PHASE-ECOM-12-QUOTE-WORKFLOW.md`
4. Finally output `PHASE-ECOM-13-QUOTE-TEMPLATES.md`

Each document should be complete and ready for an implementing AI agent to execute.

---

## REFERENCE: MASTER PROMPT CONTEXT

Below is the full context about the DRAMAC CMS E-Commerce module. Use this as your reference for understanding the platform, patterns, and requirements:

---

[PASTE ECOMMERCE-MASTER-PROMPT-V1.md CONTENT HERE]

---

**NOW GENERATE ALL 4 WAVE 2 PHASE DOCUMENTS WITH COMPLETE, IMPLEMENTATION-READY CODE.**
