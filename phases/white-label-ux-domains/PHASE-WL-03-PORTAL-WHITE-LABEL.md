# PHASE-WL-03: Client Portal White-Label & Agency Branding Injection

**Priority**: 🔴 P0 (Critical — Client-Facing)  
**Estimated Effort**: 2-3 days  
**Dependencies**: PHASE-WL-01 (BrandingProvider, agency_branding table)  
**Goal**: Client portal looks and feels like the agency's own product — zero trace of "Dramac"

---

## Context

The client portal is where agencies' customers log in to manage their websites, view bookings, check orders, and interact with their agency. Currently:
- Login page says "DRAMAC" with Dramac logo
- Sidebar shows "DRAMAC" branding
- Header shows generic platform branding
- Page titles say "| DRAMAC"
- No agency-specific welcome message
- No agency colors or theming

This is the most visible white-label gap because it's what clients see every time they log in.

---

## Task 1: Portal Login Page Branding

**Problem**: Portal login shows Dramac branding. Clients should see their agency's brand.  
**Solution**: Dynamically brand the login page based on the agency context.

### Implementation

1. **Determine agency from context**:
   The portal login URL will include the agency identifier. Options:
   - **Subdomain**: `agency-slug.portal.dramac.app/login` → extract from hostname
   - **Path**: `/portal/agency-slug/login` → extract from URL
   - **Query param**: `/portal/login?agency=xxx` → extract from query

   Use whichever pattern the current routing uses.

2. **Fetch agency branding server-side**:
   In the portal login page's server component:
   ```typescript
   const agencyBranding = await getAgencyBrandingBySlug(agencySlug);
   ```

3. **Render branded login page**:
   - Agency logo (centered, prominent)
   - Agency name as heading
   - Portal welcome title (from `branding.portal_welcome_title` or "Welcome back")
   - Portal welcome subtitle (or "Sign in to manage your account")
   - Custom login background (from `branding.portal_login_background_url`)
   - Agency colors for the sign-in button and links
   - Footer with agency support email and privacy policy link

4. **Fallback**: If no branding configured, show a clean generic login (not Dramac-branded — just "Sign in to your account")

### Login Page Layout

```
┌──────────────────────────────────────────────────┐
│                                                   │
│           [Custom Background Image]               │
│                                                   │
│          ┌─────────────────────────┐              │
│          │                         │              │
│          │     [Agency Logo]       │              │
│          │                         │              │
│          │   Welcome to Acme       │              │
│          │   Sign in to manage     │              │
│          │   your account          │              │
│          │                         │              │
│          │   ┌─────────────────┐   │              │
│          │   │ Email            │   │              │
│          │   └─────────────────┘   │              │
│          │   ┌─────────────────┐   │              │
│          │   │ Password         │   │              │
│          │   └─────────────────┘   │              │
│          │                         │              │
│          │   [=== Sign In ===]     │  ← Brand color│
│          │                         │              │
│          │   Forgot password?      │              │
│          │                         │              │
│          └─────────────────────────┘              │
│                                                   │
│   Support: help@acme.com · Privacy Policy         │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Acceptance Criteria
- [ ] Portal login shows agency logo (or styled name)
- [ ] Welcome message uses agency's custom text (or sensible default)
- [ ] Sign-in button uses agency primary color
- [ ] Custom background image shows when configured
- [ ] Footer shows agency support email and legal links
- [ ] No "Dramac" text visible anywhere on login page
- [ ] Login works correctly (no functional regression)

---

## Task 2: Portal Sidebar & Header Branding

**Problem**: Portal sidebar and header show "DRAMAC" text and generic branding.  
**Solution**: Inject agency branding into portal chrome.

### Implementation

1. **Portal Sidebar**:
   - Top area: Agency logo (or styled agency name)
   - Logo links to portal home (not Dramac site)
   - Use `useBranding()` for dynamic content
   - Agency primary color for active nav item highlight

2. **Portal Header**:
   - Agency name in page title area
   - Remove any "DRAMAC" text
   - User avatar + dropdown (already exists)

3. **Portal Page Titles**:
   - `<title>Dashboard | Acme Agency</title>` not `| DRAMAC`
   - Use `useDynamicTitle()` from PHASE-WL-01

4. **Portal Favicon**:
   - If agency has `favicon_url`, dynamically set it
   - Otherwise use default (not Dramac favicon)

### Acceptance Criteria
- [ ] Portal sidebar shows agency logo and name
- [ ] Active nav items use agency brand color
- [ ] Header shows no "Dramac" text
- [ ] Browser tab shows agency favicon and agency name in title
- [ ] Mobile portal sidebar is branded too

---

## Task 3: Portal Custom Theming via CSS Variables

**Problem**: Portal uses fixed platform colors. Agencies can't differentiate their portal.  
**Solution**: Inject agency brand colors as CSS custom properties.

### Implementation

1. In `BrandingProvider` (from PHASE-WL-01), inject a `<style>` tag:

```typescript
useEffect(() => {
  if (!branding) return;
  
  const style = document.createElement('style');
  style.id = 'agency-branding-theme';
  style.textContent = `
    :root {
      --brand-primary: ${branding.primary_color};
      --brand-primary-foreground: ${branding.primary_foreground};
      --brand-accent: ${branding.accent_color};
      --brand-accent-foreground: ${branding.accent_foreground};
    }
  `;
  document.head.appendChild(style);
  
  return () => { style.remove(); };
}, [branding]);
```

2. Update portal components to use `var(--brand-primary)` etc. for:
   - Sidebar active state
   - Primary buttons
   - Links/anchors
   - Focus rings
   - Selected states
   - Header accent bar (if any)

3. Ensure contrast ratios remain accessible (WCAG AA) regardless of color choice:
   - Validate color contrast in branding settings (PHASE-WL-01 Task 4)
   - Auto-calculate foreground color if not explicitly set

### Acceptance Criteria
- [ ] Agency brand colors applied to portal UI elements
- [ ] Buttons, links, active states use brand colors
- [ ] Colors work in both light and dark mode
- [ ] Contrast remains accessible (WCAG AA)
- [ ] Default colors look professional when agency hasn't configured branding

---

## Task 4: Branded Client Communications (In-Portal)

**Problem**: In-portal notifications and messages show platform branding.  
**Solution**: All client-facing in-portal content should reference the agency.

### Implementation

1. **Welcome Dashboard**:
   - "Welcome to [Agency Name]" heading
   - Agency-branded quick actions
   - No Dramac references

2. **Empty States**:
   - "No sites yet — contact [Agency Name] to get started"
   - "No bookings yet" (agency-neutral is fine)
   - Replace any "Powered by Dramac" or "Dramac CMS" references

3. **Toast Notifications**:
   - No Dramac branding in toast messages
   - Agency name when relevant ("Your site on [Agency Name] has been updated")

4. **Help/Support Links**:
   - "Contact [Agency Name]" not "Contact Dramac Support"
   - Support email links to agency's `support_email`
   - Support URL links to agency's `support_url`

5. **Footer (if any)**:
   - "Powered by Dramac" → Hidden on `full` white-label level
   - "Powered by Dramac" → Shown on `basic` level (with link)
   - Agency name + copyright on all levels

### Acceptance Criteria
- [ ] Portal dashboard welcome references agency name
- [ ] Support links go to agency's support (not Dramac)
- [ ] Empty states are agency-branded
- [ ] "Powered by" only shows on basic white-label level
- [ ] No toast notifications mention "Dramac"

---

## Task 5: Published Site Footer & Widget Branding

**Problem**: Published sites and embed widgets show "Powered by DRAMAC" with no agency control.  
**Solution**: Dynamic branding based on white-label level.

### Implementation

1. **Published Site Footer**:
   - `basic` level: "Built with [Agency Name] · Powered by Dramac"
   - `full` level: "[Agency Name]" only (no Dramac mention)
   - `custom` level: Agency controls footer completely

2. **Embed Widgets** (booking widget, contact form widget, etc.):
   - `basic` level: "Powered by Dramac" small text at bottom
   - `full` level: No "Powered by" text
   - Widget respects agency brand colors

3. **Booking/Commerce Public Pages**:
   - Business name + agency branding (not Dramac)
   - Confirmation pages branded to the agency
   - Customer-facing receipts show business/agency branding

### Acceptance Criteria
- [ ] Published site footer respects white-label level
- [ ] Embed widgets respect white-label level
- [ ] Full white-label → zero Dramac references on public sites
- [ ] Widget colors match agency branding

---

## Task 6: Agency-Branded PDF Documents

**Problem**: Quote and invoice PDF generation is stubbed (`generateQuotePDF()` returns null).  
**Solution**: Implement real PDF generation with agency branding.

### Implementation

1. Install `@react-pdf/renderer` or use existing PDF library
2. Create `src/lib/pdf/branded-pdf.ts`:
   - Shared PDF layout with agency header (logo, name, address)
   - Agency colors for header bar and accents
   - Footer with agency contact info

3. Implement:
   - `generateQuotePDF(quote, branding)` — Quote/Estimate PDF
   - `generateInvoicePDF(invoice, branding)` — Invoice PDF
   - `generateBookingConfirmationPDF(booking, branding)` — Booking confirmation
   - `generateOrderReceiptPDF(order, branding)` — Order receipt

4. PDF includes:
   - Agency logo (top-left)
   - Agency name and address (top-right)
   - Document title, date, reference number
   - Line items table
   - Totals (subtotal, tax, total)
   - Footer: agency contact info, terms, payment instructions
   - QR code for online payment (if applicable)

### Acceptance Criteria
- [ ] Quote PDF generates with agency branding
- [ ] Invoice PDF generates with agency branding
- [ ] PDFs look professional (clean typography, alignment)
- [ ] Logo renders correctly in PDF
- [ ] PDFs work in Chrome, Safari, Firefox print dialog

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| MODIFY | `src/app/(portal)/login/page.tsx` | Branded login page |
| MODIFY | `src/app/(portal)/layout.tsx` | BrandingProvider mount |
| MODIFY | Portal sidebar component | Agency logo/name |
| MODIFY | Portal header component | Agency branding |
| MODIFY | All portal pages | Remove "Dramac" references |
| MODIFY | Published site footer component | White-label logic |
| MODIFY | Embed widget components | White-label logic |
| CREATE | `src/lib/pdf/branded-pdf.ts` | PDF generation base |
| CREATE | `src/lib/pdf/quote-pdf.ts` | Quote PDF |
| CREATE | `src/lib/pdf/invoice-pdf.ts` | Invoice PDF |
| MODIFY | Support/help link components | Agency support URLs |

---

## Testing Checklist

- [ ] Login to portal as a client → see agency logo, colors, name (no "Dramac")
- [ ] Navigate portal → sidebar shows agency branding
- [ ] Check page titles → "[Page] | [Agency Name]"
- [ ] Check favicon → agency's custom favicon
- [ ] Portal buttons use agency primary color
- [ ] Switch to dark mode → colors still work
- [ ] Published site with `basic` white-label → "Powered by Dramac" visible
- [ ] Published site with `full` white-label → no "Dramac" anywhere
- [ ] Generate a quote PDF → agency logo, name, colors
- [ ] Generate an invoice PDF → professional layout with agency branding
- [ ] View empty states in portal → agency-branded messages
- [ ] Click "Contact Support" → goes to agency's support email
- [ ] Mobile portal → all branding renders correctly
- [ ] Agency with NO branding → clean defaults, no "Dramac"
