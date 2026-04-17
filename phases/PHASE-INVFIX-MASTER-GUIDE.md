# DRAMAC CMS — Invoice Module Overhaul & Enhancement Master Guide

> **Document Type**: Master Implementation Guide  
> **Created**: April 17, 2026  
> **Platform**: DRAMAC CMS — Enterprise Multi-Tenant SaaS  
> **Production URL**: https://app.dramacagency.com  
> **Module**: Invoicing & Financial Management (existing module overhaul)  
> **Module Slug**: `invoicing`  
> **Module Prefix**: `mod_invmod01_`  
> **Scope**: Fix all existing issues + add missing features + Chiko AI portal expansion + route cleanup

---

## How to Use This Guide

1. **Read the Memory Bank** — Start every session by reading `/memory-bank/*.md`
2. **Read This Guide** — Focus on the specific phase(s) for your session
3. **Check Prerequisites** — Verify prior phases are complete (DB tables exist, clean tsc)
4. **Run tsc Baseline** — `npx tsc --noEmit --skipLibCheck` and note error count
5. **Implement Phase** — Follow the guide exactly, use existing code patterns
6. **Verify** — `npx tsc --noEmit --skipLibCheck` must show ≤ baseline errors
7. **Test Manually** — Walk through the described user journey
8. **Commit** — `git add -A && git commit -m "feat(invfix): INVFIX-XX description"`
9. **Push** — `git push origin main`
10. **Update Memory Bank** — Update `activeContext.md` and `progress.md`

---

## Critical Platform Rules (Apply to ALL Phases)

1. **All prices in CENTS (integers)** — K250.00 = 25000
2. **Supabase returns snake_case** — Always use `mapRecord()`/`mapRecords()` from `@/lib/map-db-record`
3. **Every server page needs auth guard**: `if (!user) redirect('/login')`
4. **AI Zod schemas**: No `.int()`, `.min()`, `.max()` — Claude rejects these
5. **Vercel function timeout**: `maxDuration = 60` on all AI API routes
6. **Locale**: Zambia-first — ZMW currency, K symbol, `Africa/Lusaka` timezone, 16% VAT
7. **Email sender**: `Dramac <noreply@app.dramacagency.com>` via Resend
8. **Module DB prefix**: All tables MUST be `mod_invmod01_*`
9. **No `dark:` Tailwind variants** in storefront/public components
10. **Use semantic Tailwind**: `bg-card`, `text-foreground`, `bg-primary`
11. **`'use client'` components must NOT contain inline `'use server'` annotations** — import server actions from separate files
12. **Toast notifications**: Use `sonner` (not `useToast`)
13. **Font inline styles**: Always use `fontFamily: value || undefined`
14. **Do NOT refactor existing working code** — additive changes only unless fixing a bug
15. **Do NOT create new DB tables unless specified** — reuse the existing 19 tables
16. **Match existing patterns** — Look at how other modules do things, copy the pattern

---

## Table of Contents

### Foundation & Critical Fixes

- **INVFIX-01**: Settings Auto-Population from Site Branding + Invoice Form UX Overhaul
- **INVFIX-02**: Calculation Engine Fix, Line Item Validation & Live Preview Enhancement
- **INVFIX-03**: CRM Deep Integration — Contact Picker, Deal Links, Item Catalog Import

### Core Tab Completion

- **INVFIX-04**: Payments Tab — Online Payment Processing, Reconciliation & Receipt System
- **INVFIX-05**: Recurring Invoices — Full Lifecycle, Templates & Auto-Send
- **INVFIX-06**: Vendors, Bills & Purchase Orders — Full Completion with 3-Way Match
- **INVFIX-07**: Expenses — Approval Workflow, Receipt OCR & Mileage Tracking

### Intelligence & Reporting

- **INVFIX-08**: Reports Overhaul — Central Financial Reports Hub + Cross-Module Data
- **INVFIX-09**: Email System — Templates, Auto-Send on Status Change & Dunning Escalation

### Portal & AI

- **INVFIX-10**: Client Portal — Full Invoice Experience, Online Pay, Statement Downloads
- **INVFIX-11**: Ask Chiko — Portal Expansion, Sticky Widget, Role-Based Data Scoping

### Administration & Cleanup

- **INVFIX-12**: Super Admin Dashboard, Route Cleanup & Delivery Notes/Receipts/Quotes

---

## Platform Architecture Context

### Multi-Tenant Hierarchy

```
Super Admin (platform oversight)
  └── Agency (organization)
        ├── Team Members (roles: owner, admin, member + 32 granular permissions)
        ├── Clients (portal access with 9+ permission columns)
        └── Sites (1+ per agency)
              ├── Installed Modules (invoicing, CRM, e-commerce, booking, etc.)
              ├── Site Branding (logo, colors, fonts in sites.settings JSONB)
              ├── CRM Contacts (mod_crmmod01_contacts)
              ├── E-Commerce Products (mod_ecommod01_products)
              ├── Bookings (mod_bookmod01_bookings)
              └── Invoicing (mod_invmod01_* — 19 tables)
```

### Where This Work Lives

This is an **overhaul of an existing module** — NOT a new module build. The 19 DB tables, 150+ files, and 13 navigation tabs already exist. This guide focuses on:

1. **Fixing** broken/incomplete features
2. **Enhancing** UI/UX to industry standard
3. **Connecting** modules that should share data but don't
4. **Adding** missing features (delivery notes, receipts, email templates, reconciliation)
5. **Expanding** Chiko AI to the client portal with proper role-based scoping
6. **Cleaning up** dead routes to save Vercel route count

### Key Existing Files Reference

| Category            | Path                                                                | Description                                     |
| ------------------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| **Types**           | `src/modules/invoicing/types/`                                      | 12 type files covering all entities             |
| **Actions**         | `src/modules/invoicing/actions/`                                    | 18 server action files                          |
| **Services**        | `src/modules/invoicing/services/`                                   | 6 service files (tax, recurring, overdue, etc.) |
| **Components**      | `src/modules/invoicing/components/`                                 | ~60 components                                  |
| **Constants**       | `src/modules/invoicing/lib/invoicing-constants.ts`                  | 400+ lines of config                            |
| **Utils**           | `src/modules/invoicing/lib/invoicing-utils.ts`                      | Formatting, calculation helpers                 |
| **Bootstrap**       | `src/modules/invoicing/lib/invoicing-bootstrap.ts`                  | Module initialization                           |
| **Dashboard Pages** | `src/app/(dashboard)/dashboard/sites/[siteId]/invoicing/`           | 13 tab routes                                   |
| **Portal Pages**    | `src/app/portal/sites/[siteId]/invoicing/`                          | 6 portal pages                                  |
| **API Routes**      | `src/app/api/invoicing/`                                            | 6 API endpoints                                 |
| **Settings**        | `src/modules/invoicing/components/invoicing-settings-form.tsx`      | 509-line settings form                          |
| **Invoice Form**    | `src/modules/invoicing/components/invoice-form.tsx`                 | 430-line create/edit form                       |
| **Nav**             | `src/modules/invoicing/components/invoicing-nav.tsx`                | 86-line 13-tab nav                              |
| **Layout**          | `src/app/(dashboard)/dashboard/sites/[siteId]/invoicing/layout.tsx` | 89-line sticky layout                           |

---

## Access Control Design

### Agency Dashboard (Site Owner / Agency Member)

| User              | Capabilities                                                                   | Routes                                  |
| ----------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| **Agency Owner**  | Full access to all 13 invoicing tabs, all CRUD, settings, AI insights, reports | `/dashboard/sites/[siteId]/invoicing/*` |
| **Agency Admin**  | Same as owner                                                                  | `/dashboard/sites/[siteId]/invoicing/*` |
| **Agency Member** | Gated by `can_manage_invoicing` permission on the agency_members row           | `/dashboard/sites/[siteId]/invoicing/*` |

### Client Portal (Business Owner)

| User              | Capabilities                                                               | Routes                               |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| **Client Owner**  | View invoices, make payments, download PDFs, view statements, credit notes | `/portal/sites/[siteId]/invoicing/*` |
| **Client Member** | Gated by `can_manage_invoices` / `can_view_invoices` permission            | Reduced subset based on permissions  |

### Super Admin (Platform)

| User            | Capabilities                                                  | Routes               |
| --------------- | ------------------------------------------------------------- | -------------------- |
| **Super Admin** | Platform-wide invoicing health, abuse detection, module stats | `/admin/invoicing/*` |

### Public (No Auth)

| User                  | Capabilities                                            | Routes                                                      |
| --------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| **Invoice Recipient** | View invoice via token link, download PDF, make payment | `/api/invoicing/view/[token]`, `/api/invoicing/pay/[token]` |

---

## Existing Code Integration Points

### Files to be MODIFIED (Additive)

| File                                                                | Changes                                         | Risk   |
| ------------------------------------------------------------------- | ----------------------------------------------- | ------ |
| `src/modules/invoicing/components/invoicing-settings-form.tsx`      | Add site branding auto-populate, improve UI     | Medium |
| `src/modules/invoicing/components/invoice-form.tsx`                 | Fix layout, enhance preview, improve CRM picker | Medium |
| `src/modules/invoicing/components/invoice-preview.tsx`              | Make responsive, sticky improvements            | Low    |
| `src/modules/invoicing/components/invoicing-nav.tsx`                | May add sub-tabs or restructure                 | Low    |
| `src/modules/invoicing/components/invoice-list.tsx`                 | Improve sorting, add bulk actions               | Low    |
| `src/modules/invoicing/components/contact-invoice-picker.tsx`       | Fix data pull, add company details              | Medium |
| `src/modules/invoicing/lib/invoicing-bootstrap.ts`                  | Pull site branding on initialization            | Medium |
| `src/modules/invoicing/lib/invoicing-utils.ts`                      | Fix calculation edge cases                      | High   |
| `src/modules/invoicing/actions/invoice-actions.ts`                  | Fix number race condition, add email triggers   | High   |
| `src/modules/invoicing/actions/item-actions.ts`                     | Add e-commerce product import                   | Medium |
| `src/modules/invoicing/actions/payment-actions.ts`                  | Add online processor integration                | High   |
| `src/modules/invoicing/actions/bill-actions.ts`                     | Wire payment dialog, add matching               | Medium |
| `src/modules/invoicing/actions/purchase-order-actions.ts`           | Add receive tracking                            | Medium |
| `src/modules/invoicing/actions/report-actions.ts`                   | Add cross-module report data                    | Medium |
| `src/modules/invoicing/services/email-service.ts`                   | Complete email template system                  | Medium |
| `src/modules/invoicing/services/invoice-number-service.ts`          | Fix race condition with DB sequence             | High   |
| `src/modules/invoicing/components/bill-detail.tsx`                  | Wire payment dialog                             | Low    |
| `src/modules/invoicing/components/portal-invoice-list.tsx`          | Fix navigation to detail                        | Low    |
| `src/modules/invoicing/components/portal-invoice-detail.tsx`        | Wire payment + PDF download                     | Medium |
| `src/config/navigation.ts`                                          | Rename "Chiko AI" to "Ask Chiko"                | Low    |
| `src/config/portal-navigation.ts`                                   | Add "Ask Chiko" entry for portal                | Low    |
| `src/components/chiko/chiko-chat.tsx`                               | Adapt for portal mode, data scoping             | High   |
| `src/components/chiko/chiko-query-builder.ts`                       | Add site-level scoping for portal               | High   |
| `src/app/api/chiko/route.ts`                                        | Add portal auth, role-based data access         | High   |
| `src/app/(dashboard)/dashboard/sites/[siteId]/invoicing/layout.tsx` | UX improvements                                 | Low    |

### Files to be CREATED

```
src/modules/invoicing/
├── components/
│   ├── delivery-note-form.tsx          ← INVFIX-12
│   ├── delivery-note-list.tsx          ← INVFIX-12
│   ├── delivery-note-detail.tsx        ← INVFIX-12
│   ├── delivery-note-pdf-template.tsx  ← INVFIX-12
│   ├── receipt-template.tsx            ← INVFIX-04
│   ├── payment-receipt-pdf.tsx         ← INVFIX-04
│   ├── reconciliation-tool.tsx         ← INVFIX-04
│   ├── invoice-email-preview.tsx       ← INVFIX-09
│   ├── email-template-editor.tsx       ← INVFIX-09
│   ├── dunning-timeline.tsx            ← INVFIX-09
│   ├── expense-approval-flow.tsx       ← INVFIX-07
│   ├── expense-receipt-viewer.tsx      ← INVFIX-07
│   ├── import-ecommerce-items.tsx      ← INVFIX-03
│   ├── cross-module-report.tsx         ← INVFIX-08
│   ├── central-reports-hub.tsx         ← INVFIX-08
│   ├── po-receive-form.tsx             ← INVFIX-06
│   ├── three-way-match.tsx             ← INVFIX-06
│   └── statement-generator.tsx         ← INVFIX-10
├── actions/
│   ├── delivery-note-actions.ts        ← INVFIX-12
│   └── reconciliation-actions.ts       ← INVFIX-04
├── services/
│   └── email-template-service.ts       ← INVFIX-09

src/components/chiko/
├── ask-chiko-widget.tsx                ← INVFIX-11 (sticky bottom-right widget)
├── chiko-portal-chat.tsx               ← INVFIX-11 (portal-scoped chat)
└── chiko-data-scoper.ts                ← INVFIX-11 (role-based data resolver)

src/app/portal/sites/[siteId]/invoicing/
├── delivery-notes/
│   └── page.tsx                        ← INVFIX-12

src/app/(dashboard)/dashboard/sites/[siteId]/invoicing/
├── delivery-notes/
│   ├── page.tsx                        ← INVFIX-12
│   ├── new/page.tsx                    ← INVFIX-12
│   └── [deliveryNoteId]/page.tsx       ← INVFIX-12
```

---

## Phase Definitions

---

### Phase INVFIX-01: Settings Auto-Population from Site Branding + Invoice Form UX Overhaul

**Purpose**: Fix the #1 user complaint — settings don't pull from site branding. Make the entire invoice creation experience smooth, modern, and responsive.

#### 1.1 — Settings Auto-Populate from Site Branding

**Problem**: The invoicing settings form (`invoicing-settings-form.tsx`, 509 lines) requires users to manually enter company name, address, phone, email, website, tax ID, logo, and brand color — even though this data already exists in the site's branding settings (`sites.settings` JSONB field).

**Implementation**:

**A. New Server Action: `getAutoPopulateData(siteId: string)`**

Add to `src/modules/invoicing/actions/settings-actions.ts`:

```typescript
export async function getAutoPopulateData(siteId: string) {
  // 1. Get site name + settings (branding, logo, colors)
  const { data: site } = await supabase
    .from("sites")
    .select("name, settings")
    .eq("id", siteId)
    .single();

  // 2. Get agency details (company address, phone, email, website, tax ID)
  const { data: agencySite } = await supabase
    .from("sites")
    .select("agency_id")
    .eq("id", siteId)
    .single();

  const { data: agency } = await supabase
    .from("agencies")
    .select("name, email, phone, website, address, settings")
    .eq("id", agencySite?.agency_id)
    .single();

  // 3. Merge: site settings > agency settings > empty
  return {
    companyName: site?.name || agency?.name || "",
    companyEmail: agency?.email || "",
    companyPhone: agency?.phone || "",
    companyWebsite: agency?.website || "",
    companyAddress: agency?.address || "",
    companyTaxId: "", // Not stored at site/agency level
    brandColor: site?.settings?.primary_color || "#000000",
    brandLogoUrl: site?.settings?.logo_url || "",
  };
}
```

**B. Modify `invoicing-settings-form.tsx`**:

- Add "Auto-populate from Site Branding" button at the top of the Branding tab
- Button calls `getAutoPopulateData(siteId)` and fills in any EMPTY fields (don't overwrite user edits)
- Show a toast: "Populated from site branding. Review and save."
- Add a subtle info banner: "💡 Company details can be auto-filled from your site branding settings"

**C. Modify `invoicing-bootstrap.ts`**:

- When `seedDefaultInvoicingSettings()` runs on module install, call `getAutoPopulateData(siteId)` and pre-fill company fields
- This makes invoicing settings "pre-configured" on first install

#### 1.2 — Invoice Form UX Improvements

**Problem**: The form works but could be more intuitive.

**Changes to `invoice-form.tsx`**:

**A. Improve Client Details Card**:

- Make CRM contact picker the PRIMARY input (larger, prominent)
- Show "Or enter manually" collapse below the picker
- When a CRM contact is selected, show a compact summary card (name, email, company) with an "Edit" button if user wants to override
- Add client address auto-complete from CRM contact's full address

**B. Improve Invoice Details Card**:

- Payment terms dropdown should auto-calculate due date from issue date
- Currency selector should default to site's default currency from settings
- Add "Reference / PO Number" field visibility improvement (should be more prominent if site uses POs)

**C. Improve Line Items**:

- "Add from Catalog" button should show items from the invoicing items catalog AND e-commerce products (see INVFIX-03)
- Pre-populate default tax rate from settings on each new line item
- Display running line totals with proper formatting
- Add drag-to-reorder for line items (use @dnd-kit, same as studio builder)
- Show "Tax" column with rate name, not just percentage

**D. Improve Notes & Terms Tabs**:

- Auto-populate Terms from `defaultTerms` in settings (if empty)
- Auto-populate Payment Instructions from settings
- Add "Default Footer" from settings

**E. Responsive Improvements**:

- Live preview should be visible on md+ (768px) breakpoint, not just xl (1280px)
- On md screens, show preview in a collapsible drawer or bottom sheet
- On mobile, show a "Preview" floating button that opens a full-screen preview modal

#### 1.3 — Settings Form UX Polish

**Changes to `invoicing-settings-form.tsx`**:

- Reorganize into cleaner sections with better spacing
- Add logo upload (Supabase storage) in the branding tab
- Brand color picker: Show color preview next to hex input (already exists, ensure it works)
- Add "Preview Invoice" button in branding tab that shows how the invoice PDF will look with current settings

#### Testing Notes

- [ ] Auto-populate button fills empty fields from site branding
- [ ] Bootstrap pre-fills company details on module install
- [ ] Invoice form responsive on md+ screens
- [ ] CRM contact picker auto-fills all client fields
- [ ] Default tax rate applied to new line items
- [ ] Default terms auto-populated in notes tab
- [ ] Preview visible on tablet-sized screens

---

### Phase INVFIX-02: Calculation Engine Fix, Line Item Validation & Live Preview Enhancement

**Purpose**: Fix calculation bugs, strengthen validation, and make the live preview a best-in-class real-time document.

#### 2.1 — Fix Invoice Number Race Condition (CRITICAL)

**Problem**: `invoice-number-service.ts` reads next number and increments outside a transaction. Concurrent requests can get the same number.

**Fix**: Use PostgreSQL SEQUENCE for atomic number generation.

**Migration SQL** (add to `settings-actions.ts` on first use):

```sql
-- Create a function that atomically gets and increments the invoice counter
CREATE OR REPLACE FUNCTION mod_invmod01_next_invoice_number(p_site_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next INTEGER;
BEGIN
  UPDATE mod_invmod01_settings
  SET next_invoice_number = next_invoice_number + 1
  WHERE site_id = p_site_id
  RETURNING next_invoice_number - 1 INTO v_next;

  IF v_next IS NULL THEN
    RAISE EXCEPTION 'No invoicing settings found for site %', p_site_id;
  END IF;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- Same for credit notes
CREATE OR REPLACE FUNCTION mod_invmod01_next_credit_number(p_site_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next INTEGER;
BEGIN
  UPDATE mod_invmod01_settings
  SET next_credit_number = next_credit_number + 1
  WHERE site_id = p_site_id
  RETURNING next_credit_number - 1 INTO v_next;
  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- Same for bills
CREATE OR REPLACE FUNCTION mod_invmod01_next_bill_number(p_site_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next INTEGER;
BEGIN
  UPDATE mod_invmod01_settings
  SET next_bill_number = next_bill_number + 1
  WHERE site_id = p_site_id
  RETURNING next_bill_number - 1 INTO v_next;
  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- Same for POs
CREATE OR REPLACE FUNCTION mod_invmod01_next_po_number(p_site_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next INTEGER;
BEGIN
  UPDATE mod_invmod01_settings
  SET next_po_number = next_po_number + 1
  WHERE site_id = p_site_id
  RETURNING next_po_number - 1 INTO v_next;
  RETURN v_next;
END;
$$ LANGUAGE plpgsql;
```

**Modify `invoice-number-service.ts`**: Replace the read-then-update pattern with RPC calls:

```typescript
const { data, error } = await supabase.rpc("mod_invmod01_next_invoice_number", {
  p_site_id: siteId,
});
```

#### 2.2 — Fix Calculation Edge Cases

**Modify `invoicing-utils.ts`**:

**A. Banker's Rounding** (IEEE 754 half-even):

```typescript
function bankersRound(value: number): number {
  const rounded = Math.round(value);
  if (Math.abs(value % 1) === 0.5) {
    return rounded % 2 === 0 ? rounded : rounded - 1;
  }
  return rounded;
}
```

Replace all `Math.round()` calls in calculation functions with `bankersRound()`.

**B. Fix Discount Validation**:

- Percentage discount: Validate 0-100 range (not basis points — convert internally)
- Fixed discount: Validate not greater than line subtotal
- Invoice-level discount: Validate not greater than subtotal
- Show clear error toast if discount exceeds amount

**C. Fix Tax Calculation Consistency**:

- When inclusive tax: `taxAmount = total - (total / (1 + rate/100))`
- When exclusive tax: `taxAmount = subtotal * (rate/100)`
- When compound tax: Apply rates sequentially (each rate applied to subtotal + prior tax)
- Ensure all calculations round at the LINE level, not invoice level (prevents accumulation)

#### 2.3 — Strengthen Line Item Validation

**Modify `invoice-form.tsx`** and related line item components:

- **Required fields**: Name (non-empty), quantity (> 0), unit price (> 0)
- **Pre-fill default tax rate**: When adding a line item, pre-select the site's default tax rate
- **Discount validation**: If discount type selected, discount value required and validated
- **Tax rate dropdown**: Show "No Tax" option clearly, show rate name + percentage
- **Inline errors**: Red border + error message on invalid fields (not just on submit)
- **Prevent submission**: Button disabled with tooltip explaining validation failures

#### 2.4 — Live Preview Enhancement

**Modify `invoice-preview.tsx`**:

**A. Responsive Breakpoints**:

- `xl+` (1280px): Side-by-side sticky panel (current behavior, keep)
- `md-xl` (768-1280px): Show as a collapsible right drawer (slide-in from right)
- `<md` (mobile): "Preview" floating button → full-screen modal with preview

**B. Preview Content Enhancement**:

- Show invoice number (auto-generated format preview)
- Show company logo (from settings) at the top
- Show payment instructions at the bottom
- Show tax breakdown by rate (grouped)
- Show "Amount Due" prominently at bottom
- Show currency symbol correctly (K for ZMW, $ for USD, etc.)
- Show QR code placeholder (if enabled in settings — future feature)

**C. Sticky Behavior**:

- Keep `sticky top-20` on xl+ screens
- Ensure it doesn't overlap the sticky header (nav + tabs)
- Add max-height with internal scroll if content is very long

#### Testing Notes

- [ ] Invoice numbers are unique under concurrent creation
- [ ] Calculation matches expected totals (test with multi-line, mixed tax rates)
- [ ] Discount validation prevents impossible values
- [ ] Line items pre-fill default tax rate
- [ ] Preview visible on 768px+ screens
- [ ] Preview shows all key invoice data accurately
- [ ] Banker's rounding used throughout

---

### Phase INVFIX-03: CRM Deep Integration — Contact Picker, Deal Links, Item Catalog Import

**Purpose**: Make the invoice module a first-class citizen of the CRM ecosystem. Pull real data from CRM contacts, link deals to invoices, and import e-commerce products into the item catalog.

#### 3.1 — Enhanced CRM Contact Picker

**Modify `contact-invoice-picker.tsx`**:

**Current issue**: Picker pulls from `mod_crmmod01_contacts` but only gets basic fields.

**Enhanced query**:

```typescript
supabase
  .from("mod_crmmod01_contacts")
  .select(
    `
    id, name, email, phone, company_name, address,
    tax_id, payment_terms, preferred_currency,
    tags, custom_fields
  `,
  )
  .eq("site_id", siteId)
  .eq("status", "active")
  .order("name", { ascending: true })
  .limit(200);
```

**Enhanced auto-fill**:

- `clientName` → contact.name or contact.company_name
- `clientEmail` → contact.email
- `clientPhone` → contact.phone
- `clientAddress` → contact.address (full formatted address)
- `clientTaxId` → contact.tax_id (if available in custom fields)
- `paymentTerms` → contact.payment_terms (override default if set)
- `currency` → contact.preferred_currency (override default if set)

**UI improvements**:

- Show contact avatar/initials in dropdown
- Show company name as subtitle
- Show "Outstanding balance: K1,234" next to each contact (quick financial info)
- Recent contacts section at top
- "Create New Contact" link at bottom

#### 3.2 — CRM Deal → Invoice Link

**Problem**: Types exist for deal conversion but UI isn't wired.

**Add to CRM Deal Detail Page** (`src/modules/crm/components/deal-detail.tsx`):

- "Create Invoice" button in actions dropdown
- Pre-fills invoice with deal contact, deal value as a line item, deal name as description
- Sets `source_type: 'crm_deal'` and `source_id: dealId` on the invoice
- Show linked invoices on deal detail (query invoices where `source_type = 'crm_deal' AND source_id = dealId`)

#### 3.3 — E-Commerce Product Import to Items Catalog

**Create `src/modules/invoicing/components/import-ecommerce-items.tsx`**:

A dialog/sheet that:

1. Queries `mod_ecommod01_products` for the site
2. Lets user select products to import
3. Maps e-commerce product fields to invoicing item fields:
   - `product.name` → `item.name`
   - `product.description` → `item.description`
   - `product.base_price` → `item.unitPrice` (already in cents)
   - `product.sku` → `item.sku`
   - `product.category` → `item.category`
   - Type: "product"
4. Prevents duplicate imports (check by SKU)
5. Shows import summary: "Imported 15 products, 3 already existed"

**Add to Items page** (`items/page.tsx`):

- "Import from E-Commerce" button next to "Add Item"
- Only show if e-commerce module is installed on the site

**Create server action** in `item-actions.ts`:

```typescript
export async function importEcommerceProducts(
  siteId: string,
  productIds: string[],
);
```

#### 3.4 — Booking Service Import

**Add to Items page**:

- "Import from Booking" button (if booking module installed)
- Pulls booking services (`mod_bookmod01_services`)
- Maps service name, price, duration → invoicing item

#### 3.5 — "Add from Catalog" Enhancement in Invoice Form

**Modify the line item "Add from Catalog" button**:

- Show a searchable dialog with all items
- Group items by source: "Invoicing Items", "E-Commerce Products", "Booking Services"
- Each item shows: name, unit price, category
- Click to add as a line item (pre-fills name, price, description)
- Allow quantity adjustment before adding

#### Testing Notes

- [ ] CRM contact picker shows all active contacts with financial info
- [ ] Selecting a contact fills all available fields including tax ID and payment terms
- [ ] "Create Invoice" button works from CRM deal detail page
- [ ] E-commerce products can be imported to items catalog
- [ ] Booking services can be imported to items catalog
- [ ] "Add from Catalog" shows items from all sources
- [ ] Duplicate imports prevented by SKU check

---

### Phase INVFIX-04: Payments Tab — Online Payment Processing, Reconciliation & Receipt System

**Purpose**: Make the payments system fully functional — online payment links, proper receipt generation, and basic reconciliation tools.

#### 4.1 — Payment Receipt PDF Generation

**Create `src/modules/invoicing/components/payment-receipt-pdf.tsx`**:

- Professional receipt template matching invoice branding
- Shows: receipt number, payment date, amount, method, reference
- Shows: related invoice number, client details
- Shows: company branding (logo, colors, address)
- "Download Receipt" button on payment detail page

**Modify `payment-actions.ts`**:

- `generateReceiptNumber(siteId)` — atomic counter like invoice numbers
- `getPaymentReceipt(siteId, paymentId)` — returns full receipt data with invoice + client joins

#### 4.2 — Online Payment Integration

**Problem**: `public-payment-form.tsx` exists but doesn't connect to any payment processor.

**Implementation Strategy**: Since the platform ALREADY uses Paddle for platform billing, and sites may have their own Stripe/PayPal for e-commerce, the invoice payment system should support:

1. **Manual Recording** (existing — keep as-is)
2. **Bank Transfer Instructions** — Show site's bank details with reference number
3. **Mobile Money** (Zambia market) — Show instructions with reference
4. **Online Payment Link** — Generate a unique payment page URL that can embed Stripe/PayPal

**Modify `src/app/api/invoicing/pay/[token]/route.ts`**:

- Add payment method selection (bank transfer, mobile money, online card)
- For bank transfer: Show payment instructions from settings
- For online card (if site has Stripe configured):
  - Create Stripe Payment Intent using site's Stripe key
  - Return client secret for Stripe Elements
  - Handle webhook: mark payment recorded on success

**Note**: Full Stripe integration requires sites to configure their own Stripe keys in invoicing settings. This phase adds the setting fields and the payment flow. Actual Stripe connection is optional.

**Modify `invoicing-settings-form.tsx`**:

- Add "Online Payments" section in settings
- Fields: Stripe Secret Key (encrypted), Stripe Publishable Key, PayPal Client ID
- Toggle: "Enable Online Payments"
- Info text: "Your clients will be able to pay invoices online via the payment link"

#### 4.3 — Payment Reconciliation Tool

**Create `src/modules/invoicing/components/reconciliation-tool.tsx`**:

- Shows unmatched payments (payments without clear invoice link)
- Shows invoices with partial payments
- Drag-to-match or dropdown to link payments to invoices
- Bulk match with smart suggestions (amount matching)

**Create `src/modules/invoicing/actions/reconciliation-actions.ts`**:

```typescript
export async function getUnmatchedPayments(siteId: string);
export async function matchPaymentToInvoice(
  siteId: string,
  paymentId: string,
  invoiceId: string,
);
export async function getReconciliationSuggestions(siteId: string);
```

#### 4.4 — Payments Tab UI Enhancement

**Modify `payment-list.tsx`**:

- Add summary cards at top: Total Received (period), Total Refunded, Net Received
- Add filters: date range, payment method, status
- Add payment method distribution chart (pie chart)
- Add "Export CSV" button
- Show receipt number alongside payment

#### Testing Notes

- [ ] Payment receipt PDF downloads with correct branding
- [ ] Receipt numbers are unique and sequential
- [ ] Bank transfer instructions displayed correctly from settings
- [ ] Payment reconciliation shows unmatched items
- [ ] Reconciliation suggestions work for amount matching
- [ ] Payments tab shows summary metrics and charts
- [ ] CSV export includes all payment data

---

### Phase INVFIX-05: Recurring Invoices — Full Lifecycle, Templates & Auto-Send

**Purpose**: Make recurring invoices production-ready with proper templates, preview, and automatic sending.

#### 5.1 — Recurring Template Enhancement

**Modify `recurring-form.tsx`**:

- Improve frequency selector with visual calendar preview
- Add "Start Date" and "End Date" with date pickers
- Add "Max Occurrences" with clear count display
- Add "Auto-Send on Generation" toggle (emails invoice automatically)
- Add "Client Notification" options: email X days before next generation
- Preview next 12 occurrences (not just 6) with amounts

**Modify `recurring-actions.ts`**:

- Add `getRecurringStats(siteId)` — active count, next due, total generated
- Fix: When generating invoice from template, copy CURRENT client info (not original)
- Add: Track last generation date and result per template

#### 5.2 — Recurring Dashboard Widgets

**Add to the recurring list page**:

- Summary cards: Active Templates, Next Due This Week, Total Generated (all time), Monthly Recurring Revenue
- Calendar view: Show upcoming generations on a mini-calendar
- Failed generation alerts (if cron encounters errors)

#### 5.3 — Recurring Cron Robustness

**Modify `recurring-engine-service.ts`**:

- Add retry logic (3 attempts with exponential backoff)
- Add error logging to `mod_invmod01_invoice_activity` table
- Send alert email to site owner on generation failure
- Track generation history: created_at, status (success/failed), invoice_id, error_message

#### Testing Notes

- [ ] Recurring templates preview next 12 occurrences correctly
- [ ] Auto-send on generation emails the invoice to the client
- [ ] Client notification sent X days before generation
- [ ] Summary cards show accurate stats
- [ ] Failed generations are logged and alerted
- [ ] Generated invoices have current client info (not stale)

---

### Phase INVFIX-06: Vendors, Bills & Purchase Orders — Full Completion with 3-Way Match

**Purpose**: Complete the P2P (Procure-to-Pay) cycle with proper receive tracking, bill matching, and goods receipt notes.

#### 6.1 — Purchase Order Receive Tracking

**Add `received_quantity` to PO line items** (DB migration):

```sql
ALTER TABLE mod_invmod01_purchase_orders
ADD COLUMN IF NOT EXISTS received_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS received_by TEXT;

-- Track received quantities per line
-- Since PO line items are stored as JSONB, we'll add a separate tracking table
CREATE TABLE IF NOT EXISTS mod_invmod01_po_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  purchase_order_id UUID NOT NULL REFERENCES mod_invmod01_purchase_orders(id) ON DELETE CASCADE,
  line_index INTEGER NOT NULL, -- Index into the PO line items array
  received_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  received_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mod_invmod01_po_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_receipts_site_access" ON mod_invmod01_po_receipts
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE agency_id = (
      SELECT agency_id FROM sites WHERE id = mod_invmod01_po_receipts.site_id
    ))
  );
```

**Create `src/modules/invoicing/components/po-receive-form.tsx`**:

- Form overlay on PO detail page
- For each line item: show ordered qty, already received qty, input for new received qty
- Submit updates PO status: if all fully received → "received", if partial → "partially_received"

**Modify `purchase-order-actions.ts`**:

```typescript
export async function receivePurchaseOrder(
  siteId: string,
  poId: string,
  receipts: ReceiptInput[],
);
export async function getPoReceipts(siteId: string, poId: string);
```

#### 6.2 — Bill Payment Wiring

**Modify `bill-detail.tsx`**:

- Import and render `BillPaymentDialog` component (already created, just not wired)
- Add "Record Payment" button in the actions area
- Show payment history on bill detail page
- Track bill balance (bill total - payments made)

#### 6.3 — Three-Way Match

**Create `src/modules/invoicing/components/three-way-match.tsx`**:

- Visual comparison: PO ↔ Bill ↔ Receipt
- For each line item: ordered qty (PO) vs billed qty (Bill) vs received qty (Receipt)
- Highlight discrepancies in red
- Match status: Full Match, Partial Match, Unmatched
- Resolution actions: Accept variance, Create credit note, Flag for review

**Add to bill detail page**: "Match with PO" button that opens three-way match tool.

#### 6.4 — Vendor Enhancement

**Modify vendor form**:

- Add payment terms (Net 30, Net 60, etc.)
- Add preferred payment method
- Add bank details (for outgoing payments)
- Add vendor rating (auto-calculated from delivery timeliness)
- Show vendor metrics: total billed, total paid, outstanding, average payment time

#### Testing Notes

- [ ] PO receive tracking records line-item quantities
- [ ] PO status auto-updates on partial/full receipt
- [ ] Bill payment dialog works from bill detail page
- [ ] Bill balance updates after payment
- [ ] Three-way match highlights discrepancies
- [ ] Vendor metrics auto-calculate from transaction data

---

### Phase INVFIX-07: Expenses — Approval Workflow, Receipt OCR & Mileage Tracking

**Purpose**: Make expense tracking professional with approval chains, receipt scanning, and mileage/per-diem support.

#### 7.1 — Expense Approval Workflow

**Add approval fields to expense tracking** (Modify `expense-actions.ts`):

- Expenses with amount > threshold (configurable in settings) require approval
- Approval states: `pending_approval` → `approved` / `rejected`
- Approver: agency owner or admin
- Email notification to approver on new expense submission
- Email notification to submitter on approval/rejection

**Modify expense form**:

- Show approval status and approver info
- Add "Approve" / "Reject" buttons for authorized users
- Add rejection reason field
- auto-approve expenses below threshold (configurable, default: K500 = 50000 cents)

**Add to settings form**:

- Expense approval threshold (amount above which approval is required)
- Auto-approve toggle

#### 7.2 — Receipt Viewer Enhancement

**Create `src/modules/invoicing/components/expense-receipt-viewer.tsx`**:

- Full-screen receipt image viewer with zoom/rotate
- PDF receipt inline viewer
- Side-by-side: receipt image + expense form
- Extract data hint: Show "Tip: Upload receipt and we'll try to extract details" (AI categorization already exists)

#### 7.3 — Expense Categories Enhancement

**Modify expense category management**:

- Allow custom icons per category (from Lucide icon set)
- Color coding per category
- Budget tracking per category per month
- Overspend alerts: "Marketing expenses are 120% of monthly budget"

#### Testing Notes

- [ ] Expenses above threshold show "Pending Approval" status
- [ ] Approver gets email notification
- [ ] Approve/reject buttons work for authorized users
- [ ] Receipt viewer shows images and PDFs correctly
- [ ] Category budgets tracked and overspend alerts shown

---

### Phase INVFIX-08: Reports Overhaul — Central Financial Reports Hub + Cross-Module Data

**Purpose**: Make reports best-in-class with cross-module data integration and a central reporting location.

#### 8.1 — Enhance Existing Reports

**Modify each report component** to be more detailed:

**Revenue Report** (`revenue-trends-report.tsx`):

- Add: Revenue by source (invoices, e-commerce orders, booking payments)
- Add: Compare periods (this month vs last month, this year vs last year)
- Add: Growth rate calculation with trend indicators
- Add: Revenue by client segment (top 10, others)

**Cash Flow Report** (`cash-flow-chart.tsx`):

- Add: Include e-commerce revenue (orders)
- Add: Include booking revenue (appointments)
- Add: Net cash position per day
- Add: Projected cash flow (using AI forecast data from Insights)

**P&L Report** (`pnl-report.tsx`):

- Add: Operating expenses breakdown
- Add: Gross margin calculation
- Add: YTD comparison
- Add: Export to Excel format (CSV with proper headers)

**AR Aging Report** (`ar-aging-report.tsx`):

- Add: Click-through to filtered invoice list per aging bucket
- Add: Collection probability (based on AI risk scores)
- Add: Weighted average days outstanding

**Tax Summary** (`tax-summary-report.tsx`):

- Add: Tax liability vs tax collected comparison
- Add: Filing period breakdown (monthly/quarterly)
- Add: Export for tax filing

**Expense Report** (`expense-report.tsx`):

- Add: Budget vs actual comparison
- Add: YoY expense trends
- Add: Top vendors by spend

#### 8.2 — Cross-Module Report Data

**Modify `report-actions.ts`**:

Add new actions that pull data from other modules:

```typescript
export async function getCrossModuleRevenue(
  siteId: string,
  dateRange,
): Promise<CrossModuleRevenue> {
  // Pull from:
  // 1. mod_invmod01_invoices (invoice payments)
  // 2. mod_ecommod01_orders (e-commerce sales)
  // 3. mod_bookmod01_bookings (booking payments)
  // Return unified revenue view
}

export async function getCrossModuleClients(
  siteId: string,
): Promise<CrossModuleClientReport> {
  // Pull from:
  // 1. mod_crmmod01_contacts (client base)
  // 2. mod_invmod01_invoices (invoicing activity)
  // 3. mod_ecommod01_orders (purchase activity)
  // Return unified client activity report
}
```

**Create `src/modules/invoicing/components/cross-module-report.tsx`**:

- Unified revenue chart: invoicing + e-commerce + booking revenue on same timeline
- Client activity overview: which clients are active across which modules
- Module health scorecards

#### 8.3 — Export Capabilities

- All reports: CSV export (existing) + PDF export (new)
- Scheduled reports: Weekly/monthly email with attached report (future enhancement)
- Print-friendly view: `@media print` styles for each report

#### Testing Notes

- [ ] Revenue report shows data from invoicing, e-commerce, and booking
- [ ] Cash flow includes cross-module data
- [ ] P&L shows proper calculations with expenses
- [ ] AR aging links to filtered invoice lists
- [ ] Tax summary exports with proper filing format
- [ ] Cross-module report shows unified view
- [ ] CSV/PDF exports work for all reports

---

### Phase INVFIX-09: Email System — Templates, Auto-Send on Status Change & Dunning Escalation

**Purpose**: Complete the email notification system with professional templates, automatic sending on invoice lifecycle events, and escalating dunning for overdue invoices.

#### 9.1 — Email Template System

**Create `src/modules/invoicing/services/email-template-service.ts`**:

Available templates (Handlebars-based, matching existing Resend pattern):

1. **Invoice Created / Sent** — "New Invoice #{number} from {company}"
2. **Invoice Reminder** — "Reminder: Invoice #{number} is due on {date}"
3. **Invoice Overdue (Gentle)** — "Invoice #{number} is overdue — please review"
4. **Invoice Overdue (Urgent)** — "URGENT: Invoice #{number} is {days} days overdue"
5. **Invoice Overdue (Final)** — "Final Notice: Invoice #{number} — {days} days overdue"
6. **Payment Received** — "Thank you! Payment confirmed for Invoice #{number}"
7. **Payment Receipt** — "Payment Receipt for Invoice #{number}"
8. **Credit Note Issued** — "Credit Note #{number} issued"
9. **Recurring Invoice Generated** — "Your recurring invoice #{number} is ready"
10. **Statement** — "Your account statement for {period}"

Each template:

- Uses site branding (logo, colors, company name) from invoicing settings
- Has preview capability in the email template editor
- Is customizable (user can edit the body text, subject line)
- Falls back to professional defaults

**Create `src/modules/invoicing/components/email-template-editor.tsx`**:

- Dropdown to select template type
- Subject line editor
- Body editor (rich text with placeholders: `{{clientName}}`, `{{invoiceNumber}}`, `{{amount}}`, `{{dueDate}}`, etc.)
- Preview pane showing rendered template with mock data
- "Reset to Default" button
- Save templates in `mod_invmod01_settings` JSONB field `email_templates`

#### 9.2 — Auto-Send on Status Change

**Modify `invoice-actions.ts`**:

- When invoice status changes to `sent`: Auto-email client with "Invoice Sent" template
- When invoice becomes `overdue`: Trigger dunning sequence
- When payment recorded: Auto-email "Payment Received" + "Payment Receipt"
- When credit note issued: Auto-email "Credit Note Issued"
- When recurring generates: Auto-email "Recurring Invoice Generated" (if auto-send enabled)

**Add email sending toggle per event** in settings:

```typescript
emailNotifications: {
  onInvoiceSent: boolean; // default: true
  onPaymentReceived: boolean; // default: true
  onOverdueReminder: boolean; // default: true
  onCreditIssued: boolean; // default: true
  onRecurringGenerated: boolean; // default: false
}
```

#### 9.3 — Dunning Escalation

**Modify `overdue-service.ts`**:

Replace simple reminder with escalating dunning:

```
Day 1 overdue:  Invoice marked overdue, Gentle Reminder email (⚡ quick)
Day 7 overdue:  Reminder email (standard)
Day 14 overdue: Urgent Reminder email
Day 21 overdue: Final Notice email
Day 30 overdue: Late fee applied (if enabled in settings)
Day 45 overdue: Flag for manual follow-up (admin notification)
Day 60 overdue: Auto-mark as "write_off_candidate" (no auto-action, just flag)
```

Each step:

- Logs to activity table
- Fires automation event (`invoice.dunning_stage_1`, `invoice.dunning_stage_2`, etc.)
- Respects settings (user can disable auto-emails)
- Tracks which stage the invoice is at (prevents duplicate sends)

**Create `src/modules/invoicing/components/dunning-timeline.tsx`**:

- Visual timeline on invoice detail page showing dunning history
- Shows: which emails were sent, when, current stage
- Manual "Send Reminder Now" button
- Manual "Pause Dunning" toggle per invoice

#### Testing Notes

- [ ] All 10 email templates render with site branding
- [ ] Email template editor allows customization with preview
- [ ] Auto-send triggers on status changes (configurable)
- [ ] Dunning sequence escalates correctly through stages
- [ ] Late fees applied at correct dunning stage
- [ ] Dunning timeline shows history on invoice detail
- [ ] Manual "Send Reminder" works independently of auto-dunning
- [ ] Email toggle settings respected

---

### Phase INVFIX-10: Client Portal — Full Invoice Experience, Online Pay, Statement Downloads

**Purpose**: Make the client portal invoicing experience best-in-class — clients should be able to view, pay, download, and manage their invoices seamlessly.

#### 10.1 — Portal Invoice List Enhancement

**Modify `portal-invoice-list.tsx`**:

- Make invoice rows clickable → navigate to detail page
- Add status filter buttons (All, Outstanding, Paid, Overdue)
- Add search by invoice number or amount
- Show "Pay Now" quick action button on overdue invoices
- Add mobile-responsive card view for small screens

#### 10.2 — Portal Invoice Detail Enhancement

**Modify `portal-invoice-detail.tsx`**:

- Show full invoice details (matching the PDF template layout)
- "Download PDF" button (prominent, top right)
- "Pay Now" button (large, primary color) for unpaid invoices
- Payment history section (all payments made against this invoice)
- Related credit notes section
- Activity timeline (sent, viewed, payment dates)
- Share button (copy public link)

#### 10.3 — Portal Payment Flow

**Enhance portal payment experience**:

- Show payment options based on settings (bank transfer, mobile money, online card)
- Bank transfer: Show formatted instructions with invoice reference
- Mobile money: Show number + instructions
- Online card: Embed Stripe Elements (if configured)
- After payment: Show confirmation page with receipt download

#### 10.4 — Statement Downloads

**Modify `portal-statement.tsx`**:

- Client statement period selector (monthly, quarterly, custom range)
- Statement shows: all invoices, payments, credits, running balance
- "Download PDF" for the selected period
- "Download CSV" for accounting import
- Email statement: "Send to my email" button

#### 10.5 — Portal Dashboard Enhancement

**Modify `portal-invoice-overview.tsx`**:

- Metric cards: Total Outstanding, Total Overdue, Last Payment, Next Due Invoice
- Recent invoices table (last 5, clickable)
- Quick pay: "Pay All Outstanding" button (if online payment enabled)
- Account balance: Running balance calculation
- Payment history chart (last 12 months)

#### Testing Notes

- [ ] Portal invoice list click navigates to detail
- [ ] Filters and search work on portal list
- [ ] Invoice detail shows all data with PDF download
- [ ] Payment flow shows correct options from settings
- [ ] Bank transfer instructions display properly
- [ ] Statement downloads as PDF and CSV
- [ ] Portal dashboard shows accurate financial summary
- [ ] Mobile responsive for all portal pages

---

### Phase INVFIX-11: Ask Chiko — Portal Expansion, Sticky Widget, Role-Based Data Scoping

**Purpose**: Rename "Chiko AI" to "Ask Chiko", expand to client portal with proper data isolation, and add a sticky floating widget for easy access.

#### 11.1 — Rename "Chiko AI" to "Ask Chiko"

**Modify `src/config/navigation.ts`**:

```typescript
// Change:
{ title: "Chiko AI", href: "/dashboard/chiko", icon: Sparkles }
// To:
{ title: "Ask Chiko", href: "/dashboard/chiko", icon: Sparkles }
```

**Modify Chiko chat component** titles and headings.

#### 11.2 — Role-Based Data Scoping

**Create `src/components/chiko/chiko-data-scoper.ts`**:

This is the critical security layer. Different user contexts get different data access:

```typescript
export type ChikoContext =
  | { mode: "agency"; agencyId: string; userId: string } // Agency owner/admin
  | { mode: "site"; siteId: string; userId: string; clientId: string }; // Client portal

export function buildScopedQueries(context: ChikoContext): ScopedQuery[] {
  if (context.mode === "agency") {
    // Agency mode: query across ALL agency sites
    // Revenue, subscriptions, clients, orders, bookings — all scoped by agency_id
    return buildAgencyQueries(context.agencyId);
  }

  if (context.mode === "site") {
    // Site mode: query ONLY this specific site's data
    // Invoice status, payment history, booking schedule — scoped by site_id
    // MUST NOT leak data from other sites or agency-level data
    return buildSiteQueries(context.siteId);
  }
}
```

**Key Security Rules**:

1. **Portal (site mode)**: Can ONLY query data for their specific site
2. **Portal (site mode)**: Cannot see agency-level billing, subscriptions, or other site data
3. **Portal (site mode)**: Cannot see staff/team data or internal notes
4. **Agency (agency mode)**: Can query all data across all their sites
5. **Validate context server-side**: Never trust client-sent context

**Modify `src/app/api/chiko/route.ts`**:

```typescript
// Detect context:
// 1. Check if request comes from portal (header or query param)
// 2. If portal: verify client ownership of the site
// 3. Build scoped queries based on context
// 4. Pass scoped context to Claude
```

#### 11.3 — Sticky "Ask Chiko" Widget

**Create `src/components/chiko/ask-chiko-widget.tsx`**:

A floating, persistent chat widget available on every page:

```typescript
"use client";

// Sticky bottom-right glowing orb
// Position: fixed, bottom-6, right-6, z-50
// Appearance: 56px circle, gradient bg (primary to accent), subtle pulse animation
// Icon: Sparkles (white, centered)
// Tooltip: "Ask Chiko" on hover
// Click: Opens chat panel (slide-up from bottom-right, 400px wide, 500px tall)
// Close: X button or click outside
// Minimizes to: just the orb with unread indicator

// Chat panel:
// - Header: "Ask Chiko" + close button
// - Message history (scrollable)
// - Quick action chips (same as current)
// - Input field + send button
// - Powered by text: "Powered by AI • Your data stays private"
```

**Placement**:

- Agency Dashboard: Show on ALL pages (not just `/dashboard/chiko`)
- Client Portal: Show on ALL portal pages (permission: only for client owners)
- Conditionally hide: On the dedicated Chiko page (full-page already), on mobile (< 640px)

**Permission Gate**:

```typescript
// Agency dashboard: visible to Owner + Admin roles
// Client portal: visible to Client Owner only
// Never show to: agency members with no AI access, low-ranking team members
```

#### 11.4 — Portal Chiko Page (Optional Full-Page)

**Create `src/app/portal/ask-chiko/page.tsx`**:

- Full-page chat experience (like the dashboard version)
- Uses site-scoped data context
- Shows: "Ask me about your invoices, bookings, orders, or anything about your site"
- Quick actions relevant to portal: "What's my outstanding balance?", "Show my recent orders", "When's my next booking?"

**Add to portal navigation** (`portal-navigation.ts`):

```typescript
// In the Support group:
{
  title: "Ask Chiko",
  href: "/portal/ask-chiko",
  icon: Sparkles,
  visible: (permissions) => permissions.isOwner // Only site owners
}
```

#### 11.5 — Chiko Query Builder Enhancement

**Modify `chiko-query-builder.ts`**:

Add site-level query categories:

```typescript
// New site-level queries (for portal mode):
'site_invoices'  — Outstanding, overdue, paid invoices for this site
'site_payments'  — Payment history for this site
'site_bookings'  — Upcoming bookings for this site
'site_orders'    — Recent orders for this site
'site_analytics' — Basic site traffic data
```

Each category scoped by `site_id`, never `agency_id`.

#### Testing Notes

- [ ] "Ask Chiko" shows in dashboard nav (renamed from "Chiko AI")
- [ ] Sticky widget appears on all dashboard pages
- [ ] Sticky widget appears on all portal pages (owner only)
- [ ] Widget opens/closes smoothly with animation
- [ ] Portal Chiko queries ONLY site-specific data
- [ ] Agency Chiko queries ALL agency data (unchanged behavior)
- [ ] Portal user cannot access agency-level data through Chiko
- [ ] Quick actions are contextual (different for portal vs dashboard)
- [ ] Full-page portal Chiko works at `/portal/ask-chiko`
- [ ] Conversation history persists within session

---

### Phase INVFIX-12: Super Admin Dashboard, Route Cleanup & Delivery Notes/Receipts/Quotes

**Purpose**: Complete the module with delivery notes, cleanup dead routes, and ensure the super admin has proper oversight.

#### 12.1 — Delivery Notes

**Problem**: No delivery note system exists. For businesses that ship goods, delivery notes are essential.

**Create DB table** (migration):

```sql
CREATE TABLE IF NOT EXISTS mod_invmod01_delivery_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  delivery_note_number TEXT NOT NULL,
  invoice_id UUID REFERENCES mod_invmod01_invoices(id),
  purchase_order_id UUID REFERENCES mod_invmod01_purchase_orders(id),
  client_name TEXT NOT NULL,
  client_address TEXT,
  delivery_address TEXT,
  delivery_date TIMESTAMPTZ,
  line_items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, dispatched, delivered, returned
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  driver_name TEXT,
  vehicle_info TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mod_invmod01_delivery_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delivery_notes_site_access" ON mod_invmod01_delivery_notes
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    ))
  );

-- Atomic number generation
CREATE OR REPLACE FUNCTION mod_invmod01_next_delivery_note_number(p_site_id UUID)
RETURNS INTEGER AS $$
DECLARE v_next INTEGER;
BEGIN
  UPDATE mod_invmod01_settings
  SET next_delivery_note_number = COALESCE(next_delivery_note_number, 1) + 1
  WHERE site_id = p_site_id
  RETURNING next_delivery_note_number - 1 INTO v_next;
  RETURN COALESCE(v_next, 1);
END;
$$ LANGUAGE plpgsql;
```

**Add `next_delivery_note_number` column to settings**:

```sql
ALTER TABLE mod_invmod01_settings
ADD COLUMN IF NOT EXISTS next_delivery_note_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS delivery_note_prefix TEXT DEFAULT 'DN';
```

**Create files**:

- `src/modules/invoicing/types/delivery-note-types.ts` — DeliveryNote, CreateDeliveryNoteInput interfaces
- `src/modules/invoicing/actions/delivery-note-actions.ts` — CRUD + status transitions
- `src/modules/invoicing/components/delivery-note-form.tsx` — Create/edit form
- `src/modules/invoicing/components/delivery-note-list.tsx` — List with filters
- `src/modules/invoicing/components/delivery-note-detail.tsx` — Detail view
- `src/modules/invoicing/components/delivery-note-pdf-template.tsx` — PDF template
- Dashboard pages: `invoicing/delivery-notes/page.tsx`, `new/page.tsx`, `[id]/page.tsx`

**Add "Delivery Notes" tab to nav** (between Purchase Orders and Settings).

**Flow**:

1. Create delivery note (linked to invoice or PO)
2. Add items (auto-populated from linked invoice/PO)
3. Set delivery date, address, driver info
4. Print/PDF for driver
5. Mark dispatched → delivered
6. Track delivery status

#### 12.2 — Route Cleanup

**Dead routes to remove**:

1. **`src/app/api/make-admin/`** — Empty folder, no route.ts. DELETE entire directory.
2. Check for and remove any unused test pages or debug routes.

**Route optimization**: Review any catch-all `[...path]` routes that could be simplified. Each catch-all generates ~12 Vercel routes.

**Estimate**: Removing dead routes should free 5-15 Vercel routes.

#### 12.3 — Super Admin Invoice Dashboard

**Modify `src/modules/invoicing/actions/admin-actions.ts`**:

```typescript
export async function getInvoicingPlatformStats(): Promise<PlatformStats> {
  // Total invoices across all sites
  // Total revenue across all sites
  // Sites with most overdue invoices (abuse detection)
  // Invoice volume trends (daily/weekly/monthly)
  // Active recurring templates count
  // Top sites by invoice volume
}
```

**Create/Enhance admin page** (`src/app/(dashboard)/admin/invoicing/page.tsx`):

- Platform-wide invoicing stats
- Sites with highest overdue ratios (potential issues)
- Invoice volume chart (platform-wide trends)
- Module health: cron status, error rates, delivery success

#### 12.4 — Quote to Invoice Conversion

The platform already has quotes (quote portal with email verification). Add direct conversion:

**Modify quote detail/actions**:

- "Convert to Invoice" button on accepted quotes
- Pre-fills invoice with quote data (client, items, amounts)
- Sets `source_type: 'quote_conversion'` and `source_id: quoteId`
- Marks quote as "converted" after invoice creation

#### 12.5 — Final Polish & Navigation

**Update `invoicing-nav.tsx`** to add Delivery Notes tab:

```typescript
// Insert between Purchase Orders and Settings:
{ label: 'Delivery Notes', icon: Truck, href: '/delivery-notes' }
```

**Update settings form**: Add delivery note prefix and numbering settings.

#### Testing Notes

- [ ] Delivery notes CRUD works end-to-end
- [ ] Delivery notes can be linked to invoices or POs
- [ ] Delivery note PDF generates with correct branding
- [ ] Status tracking: draft → dispatched → delivered
- [ ] Dead API routes removed
- [ ] Vercel route count reduced
- [ ] Super admin sees platform-wide invoicing stats
- [ ] Quote to invoice conversion works
- [ ] Navigation shows Delivery Notes tab

---

## Automation Integration

### Events Added (append to existing `event-types.ts`)

```typescript
// Invoice lifecycle
"invoice.dunning_stage_1"; // Gentle reminder sent
"invoice.dunning_stage_2"; // Standard reminder sent
"invoice.dunning_stage_3"; // Urgent reminder sent
"invoice.dunning_stage_4"; // Final notice sent
"invoice.late_fee_applied"; // Late fee auto-applied
"invoice.write_off_flagged"; // Flagged for write-off

// Delivery notes
"delivery_note.created"; // Delivery note created
"delivery_note.dispatched"; // Goods dispatched
"delivery_note.delivered"; // Goods delivered

// Expense approval
"expense.approval_requested"; // Expense submitted for approval
"expense.approved"; // Expense approved
"expense.rejected"; // Expense rejected

// Reconciliation
"payment.reconciled"; // Payment matched to invoice
"payment.unmatched"; // Payment couldn't be auto-matched
```

### Actions Added (append to existing `action-types.ts`)

```typescript
"invoicing.send_reminder"; // Send reminder email for invoice
"invoicing.apply_late_fee"; // Apply late fee to overdue invoice
"invoicing.send_statement"; // Send account statement to client
"invoicing.create_from_quote"; // Convert accepted quote to invoice
```

---

## Cross-Module Integration Reference

### CRM Module (mod*crmmod01*)

| Direction | Data                                                           | Files Modified             |
| --------- | -------------------------------------------------------------- | -------------------------- |
| Read      | Contact details (name, email, phone, address, company, tax_id) | contact-invoice-picker.tsx |
| Read      | Contact payment terms & preferred currency                     | contact-invoice-picker.tsx |
| Read      | Deal info for invoice pre-fill                                 | crm-integration-actions.ts |
| Write     | Financial profile updates (total invoiced, outstanding)        | crm-integration-actions.ts |
| Write     | Invoice link on deal record                                    | crm-integration-actions.ts |

### E-Commerce Module (mod*ecommod01*)

| Direction | Data                                         | Files Modified                              |
| --------- | -------------------------------------------- | ------------------------------------------- |
| Read      | Product catalog (name, price, SKU, category) | import-ecommerce-items.tsx, item-actions.ts |
| Read      | Order data for invoice creation              | ecommerce-integration-actions.ts            |
| Read      | Revenue data for cross-module reports        | report-actions.ts                           |

### Booking Module (mod*bookmod01*)

| Direction | Data                                    | Files Modified                 |
| --------- | --------------------------------------- | ------------------------------ |
| Read      | Service catalog (name, price, duration) | import-ecommerce-items.tsx     |
| Read      | Booking data for invoice creation       | booking-integration-actions.ts |
| Read      | Revenue data for cross-module reports   | report-actions.ts              |

### Marketing Module (mod*mktmod01*)

| Direction | Data                                  | Files Modified   |
| --------- | ------------------------------------- | ---------------- |
| Read      | Subscriber data for statement mailing | email-service.ts |

### Site Settings

| Direction | Data                                  | Files Modified                              |
| --------- | ------------------------------------- | ------------------------------------------- |
| Read      | Branding (logo, colors, company info) | settings-actions.ts, invoicing-bootstrap.ts |
| Read      | Agency details (name, email, phone)   | settings-actions.ts                         |

---

## Testing Requirements

### Per-Phase Checklist

Each phase must pass:

1. **TypeScript compilation**: `npx tsc --noEmit --skipLibCheck` — errors ≤ baseline
2. **No new warnings**: Check for unused imports, unreachable code
3. **Manual verification**: Walk through the described user journeys
4. **Cross-module**: Test that data flows correctly between modules

### Key User Journeys to Validate

1. **New Site Owner Journey**: Create site → Install invoicing → Settings auto-populated from branding → Create first invoice with CRM contact → Send invoice → Record payment
2. **Recurring Invoice Journey**: Create template → Verify cron generates invoices → Auto-send email → Payment recorded → Balance updated
3. **Client Portal Journey**: Client logs in → Views invoices → Downloads PDF → Makes payment → Views receipt → Downloads statement
4. **Procurement Journey**: Create PO → Send to vendor → Receive goods → Create bill → Three-way match → Record bill payment
5. **Overdue Journey**: Invoice overdue → Dunning stage 1 → 2 → 3 → 4 → Late fee applied → Manual follow-up flag
6. **Ask Chiko (Agency)**: "What's my outstanding revenue?" → Queries all sites → Shows accurate total
7. **Ask Chiko (Portal)**: "Show my unpaid invoices" → Queries only client's site → Shows correct data

---

## Module Registration Checklist

Since this is an EXISTING module overhaul, most registration is already done:

- [x] Database: modules_v2 record exists
- [x] Migration files applied
- [x] Code catalog: module-catalog.ts entry exists
- [x] Core module auto-install: In CORE_MODULE_SLUGS
- [x] Bootstrap function: seedDefaultInvoicingSettings exists (MODIFY: add branding pull)
- [x] Dashboard navigation: navigation.ts entry exists
- [x] Portal navigation: portal-navigation.ts entry exists
- [x] Portal module registry: Registered
- [x] Admin navigation: Admin nav entry exists
- [x] Permissions: can_manage_invoices exists
- [x] AI Designer types: ModuleType includes invoicing
- [x] Automation events: Invoice events exist (ADD: new dunning/delivery events)
- [x] Automation actions: Invoice actions exist (ADD: new reminder/statement actions)
- [ ] **NEW**: Add delivery notes tab to navigation
- [ ] **NEW**: Add "Ask Chiko" to portal navigation
- [ ] **MODIFY**: Rename "Chiko AI" to "Ask Chiko" in navigation
- [ ] **NEW**: Add delivery notes DB table + RLS + migration
- [ ] **NEW**: Add PO receipts DB table + migration
- [ ] **NEW**: Add atomic number generation RPCs
