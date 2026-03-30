# DRAMAC CMS — Forms & Input Components Master Plan

## Executive Vision

Transform DRAMAC's form and input component system from a partially-connected set of 4 components into a **fully-wired, submission-ready, world-class form library** capable of producing functional contact forms, newsletter signups, and custom data-capture forms that work **out of the gate** on every published site — with zero manual configuration. Every form the AI Designer generates must submit data, deliver email notifications, and protect against spam **immediately upon deployment**, rivalling Typeform, HubSpot, and Webflow's form systems.

Forms are the **lead generation engine of every website**. Every business inquiry, every newsletter signup, every booking request flows through a form. If forms work perfectly — submitting reliably, notifying instantly, blocking spam, and looking beautiful — the platform converts visitors into leads for every site it generates. This plan treats form components as the highest-value functional category in DRAMAC's component system because **a form that doesn't submit is worse than no form at all**.

---

## Table of Contents

0. [Section 0 — Implementation Blueprint](#section-0--implementation-blueprint)
1. [Current State Audit](#1-current-state-audit)
2. [Industry Benchmark Analysis](#2-industry-benchmark-analysis)
3. [Architecture Principles](#3-architecture-principles)
4. [Component Deep Dive — Form (Container)](#4-component-deep-dive--form-container)
5. [Component Deep Dive — FormField (Input)](#5-component-deep-dive--formfield-input)
6. [Component Deep Dive — ContactForm (Pre-Built)](#6-component-deep-dive--contactform-pre-built)
7. [Component Deep Dive — Newsletter (Signup)](#7-component-deep-dive--newsletter-signup)
8. ["Out of the Gate" Submission Architecture](#8-out-of-the-gate-submission-architecture)
9. [Validation & Error Handling](#9-validation--error-handling)
10. [Accessibility & WCAG Compliance](#10-accessibility--wcag-compliance)
11. [Dark Mode & Theming](#11-dark-mode--theming)
12. [AI Designer Integration](#12-ai-designer-integration)
13. [Registry & Converter Alignment](#13-registry--converter-alignment)
14. [Implementation Phases](#14-implementation-phases)
15. [Testing & Quality Gates](#15-testing--quality-gates)

---

## Section 0 — Implementation Blueprint

> **For the AI agent implementing this plan.** Read this section FIRST. It contains every file path, every line number, every prop name, and every registration point you need. Do NOT guess — use these exact references.

### 0.1 File Map

| File | Absolute Path | Purpose |
|------|---------------|---------|
| **renders.tsx** | `src/lib/studio/blocks/renders.tsx` | Render functions for all 4 form components |
| **core-components.ts** | `src/lib/studio/registry/core-components.ts` | `defineComponent()` registrations with fields, defaultProps, AI hints |
| **component-metadata.ts** | `src/lib/studio/registry/component-metadata.ts` | AI discovery metadata (keywords, usageGuidelines) |
| **converter.ts** | `src/lib/ai/website-designer/converter.ts` | `typeMap` aliases + `KNOWN_REGISTRY_TYPES` + keyword mappings |
| **renderer.tsx** | `src/lib/studio/engine/renderer.tsx` | Dispatches render functions, injects `siteId` via `injectedProps` |
| **route.ts (submit)** | `src/app/api/forms/submit/route.ts` | Form submission API: validate → honeypot → rate-limit → store → notify → webhook |
| **route.ts (export)** | `src/app/api/forms/export/route.ts` | CSV export of form submissions |
| **route.ts (CRM)** | `src/app/api/modules/crm/form-capture/route.ts` | CRM contact creation from form captures |
| **submission-service.ts** | `src/lib/forms/submission-service.ts` | FormSettings/FormSubmission interfaces, CRUD operations |
| **notification-service.ts** | `src/lib/forms/notification-service.ts` | Email notification dispatch via Resend |
| **webhook-service.ts** | `src/lib/forms/webhook-service.ts` | Webhook dispatch with HMAC signatures |
| **spam-protection.ts** | `src/lib/forms/spam-protection.ts` | Honeypot, rate-limiting, spam keyword detection |
| **send-branded-email.ts** | `src/lib/email/send-branded-email.ts` | Branded email rendering (agency + site branding) |
| **layout-utils.ts** | `src/lib/studio/blocks/layout-utils.ts` | Shared sizing/spacing utility maps |

### 0.2 Exact Line Numbers (Verified via grep — 2026-03)

#### renders.tsx

| Component | Interface Start | Export Function | Props Count |
|-----------|----------------|-----------------|-------------|
| **Form** | L15892 (`export interface FormProps`) | L15973 (`export function FormRender`) | 71 |
| **FormField** | L16296 (`export interface FormFieldProps`) | L16426 (`export function FormFieldRender`) | 67 |
| **ContactForm** | L16887 (`export interface ContactFormProps`) | L16917 (`export function ContactFormRender`) | 30 |
| **Newsletter** | L17225 (`export interface NewsletterProps`) | L17241 (`export function NewsletterRender`) | 14 |

#### core-components.ts

| Component | `defineComponent({` | `type:` line | Fields | Field Groups | defaultProps |
|-----------|---------------------|-------------|--------|--------------|-------------|
| **Form** | L12513 | L12514 | 50+ | 13 | L12920 |
| **FormField** | L12951 | L12952 | 45+ | 12 | L13282 |
| **ContactForm** | L13330 | L13331 | 7 | 0 (flat) | L13362 |
| **Newsletter** | L13376 | L13377 | 6 | 0 (flat) | L13419 |

#### component-metadata.ts

| Component | `type:` line | Category | Keywords |
|-----------|-------------|----------|----------|
| **Form** | L581 | forms | form, input, submit |
| **FormField** | L593 | forms | input, field, text, email |
| **ContactForm** | L604 | forms | contact, form, email, message |
| **Newsletter** | L616 | forms | newsletter, email, signup, subscribe |

#### converter.ts (website-designer)

| Alias | Maps To | Line |
|-------|---------|------|
| `ContactFormBlock` | `"ContactForm"` | L376 |
| `NewsletterBlock` | `"Newsletter"` | L388 |
| `Location` | `"ContactForm"` | L454 |
| `LocationBlock` | `"ContactForm"` | L455 |
| `LocationSection` | `"ContactForm"` | L456 |
| `ContactBlock` | `"ContactForm"` | L479 |
| `ContactSection` | `"ContactForm"` | L480 |
| `Contact` | `"ContactForm"` | L481 |
| `ContactInfoBlock` | `"ContactForm"` | L482 |
| `ContactInfo` | `"ContactForm"` | L483 |
| `NewsletterSection` | `"Newsletter"` | L485 |
| `SubscribeBlock` | `"Newsletter"` | L486 |
| `Subscribe` | `"Newsletter"` | L487 |
| `ContactForm` | `"ContactForm"` | L535 (KNOWN_REGISTRY_TYPES) |
| `Newsletter` | `"Newsletter"` | L555 (KNOWN_REGISTRY_TYPES) |

**Keyword-based mappings** (lowercase slug → component):
- `location`, `findus`, `visitreuneus` → `"ContactForm"` (L890-L892)
- `contactinfo`, `contactdetails`, `reachout` → `"ContactForm"` (L912-L914)

**`KNOWN_REGISTRY_TYPES` Set**: `"ContactForm"` at L783, `"Newsletter"` at L784.

> ⚠️ **Missing from KNOWN_REGISTRY_TYPES**: `"Form"` and `"FormField"` are NOT in the Set. This means the AI converter cannot generate generic Form+FormField compositions. Currently only ContactForm and Newsletter are AI-generatable.

### 0.3 Props Pipeline

```
AI Designer generates component JSON
  ↓
converter.ts typeMap resolves alias → registered type name
  ↓
Component JSON stored in site content (Supabase JSONB)
  ↓
renderer.tsx reads component.type, looks up render function from registry
  ↓
renderer.tsx L218-228: injects siteId into ALL components:
    let injectedProps = {
      ...component.props,
      siteId: component.props?.siteId || siteId,
    };
  ↓
Render function receives props via destructuring
  ↓
ContactFormRender uses siteId to POST to /api/forms/submit
```

**Critical insight:** `siteId` is auto-injected by `renderer.tsx` into every component. ContactFormRender receives it automatically. No manual wiring needed.

### 0.4 Database Tables

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `form_settings` | `site_id` + `form_id` (unique), `notify_emails TEXT[]`, `notify_on_submission`, `enable_honeypot`, `enable_rate_limit`, `rate_limit_per_hour`, `success_message`, `redirect_url` | Per-site, per-form configuration |
| `form_submissions` | `site_id`, `form_id`, `data JSONB`, `status` (new/read/archived/spam), `is_spam`, `metadata` (page_url, user_agent, ip_address, referrer) | Stored submissions |
| `form_webhooks` | `site_id`, `form_id` (NULL = all forms), `url`, `method`, `headers JSONB`, `is_active` | Webhook endpoints |

### 0.5 Submission API Flow

```
POST /api/forms/submit
  Body: { siteId, formId, data, honeypot }
  ↓
  1. Validate required fields (siteId, formId, data)
  2. Verify site exists in `sites` table
  3. Query `form_settings` for site_id + form_id
     → If no row exists, use defaults:
        {
          success_message: "Thank you for your submission!",
          enable_honeypot: true,
          enable_rate_limit: true,
          rate_limit_per_hour: 10,
          notify_on_submission: true,
          notify_emails: []  ← ⚠️ EMPTY by default!
        }
  4. Honeypot check → if filled, return fake success (bots don't notice)
  5. Rate limit → memory + DB hybrid check (per IP, per form, per hour)
  6. Spam detection → keyword pattern matching
  7. Insert into `form_submissions`
  8. Send email notifications (async) → to form_settings.notify_emails
  9. Trigger webhooks (async) → to form_webhooks entries
  10. Return { success, message, redirect, submissionId }
```

### 0.6 Render Skeleton Pattern

Every form render function follows this structure:

```tsx
export function [Component]Render({
  // Destructured props with defaults
  prop1 = "default",
  prop2 = "default",
}: [Component]Props) {
  // 1. State management (useState for form status, errors)
  // 2. Derived values (class maps, style objects)
  // 3. Event handlers (handleSubmit, handleChange)
  // 4. Return JSX:
  //    <form action={...} method={...} onSubmit={...}>
  //      {/* Header: title + description */}
  //      {/* Form fields or children */}
  //      {/* Honeypot hidden field (if applicable) */}
  //      {/* Submit button */}
  //      {/* Success/error messages */}
  //    </form>
}
```

### 0.7 Build Checklist — Use for EVERY Change

```
□ renders.tsx    — render function compiles with zero TS errors
□ renders.tsx    — every prop in interface is consumed in function body
□ core-components.ts — every field name matches a render prop name EXACTLY
□ core-components.ts — defaultProps keys exist in fields
□ core-components.ts — ai.canModify keys exist in fields
□ component-metadata.ts — entry exists with correct type and category
□ converter.ts   — typeMap alias(es) exist
□ converter.ts   — type is in KNOWN_REGISTRY_TYPES set
□ tsc --noEmit   — zero new errors introduced
□ /api/forms/submit — test submission returns { success: true }
```

### 0.8 DO / DON'T Rules

| ✅ DO | ❌ DON'T |
|-------|---------|
| Use `style={{}}` for all colours | Use Tailwind colour classes (bg-red-600, text-blue-500) |
| Use CSS variables with fallbacks: `var(--color-primary, #3b82f6)` | Hardcode hex/rgb values without CSS var wrapper |
| Match field names in registry EXACTLY to prop names in render | Use camelCase in one and snake_case in other |
| Include siteId in form submission payloads | Assume siteId will be manually configured |
| Use `<form>` with `action` and `method` attributes | Use `<div onClick>` for form submission |
| Use `<label htmlFor>` on every input | Leave inputs unlabelled |
| Use `<button type="submit">` for submit buttons | Use `<div>` or `<a>` as submit triggers |
| Use `aria-required`, `aria-invalid`, `aria-describedby` | Rely only on visual indicators for validation |
| Provide visible focus indicators (`:focus-visible`) | Remove outline without replacement |
| POST to `/api/forms/submit` for all platform-hosted forms | Use `mailto:` links or third-party endpoints |
| Include honeypot field on all public forms | Skip spam protection |
| Test dark mode rendering for every variant | Assume light mode styles work in dark mode |

---

## 1. Current State Audit

### 1.1 Existing Form Components (4 total)

| Component | Location | Interface→Export | Props | Quality | Key Issues |
|-----------|----------|-----------------|-------|---------|------------|
| **FormRender** | `renders.tsx` L15892→L15973 | 71 | ⚠️ Generic | No `/api/forms/submit` integration. Generic `<form>` wrapper with `action`/`method`/`onSubmit`. Styling-rich (13 field groups — layout, header, submit button, animation, messages) but no built-in submission pipeline. Accepts children (FormField components). |
| **FormFieldRender** | `renders.tsx` L16296→L16426 | 67 | ✅ Strong | Comprehensive field component: 17 input types, prefix/suffix, icons, validation, password toggle, char count, clear button. Well-structured with correct variant maps. This is the best component in the set. |
| **ContactFormRender** | `renders.tsx` L16887→L16917 | 30 | ✅ Functional | **Only component with built-in submission.** POSTs to `/api/forms/submit` with siteId + honeypot. Has success/error states. BUT: `emailTo` prop is sent in data as `_emailTo` but the API **never reads it** — emails only come from `form_settings.notify_emails`. If no `form_settings` row exists, `notify_emails` defaults to `[]` — **no notifications get sent**. |
| **NewsletterRender** | `renders.tsx` L17225→L17241 | 14 | ⚠️ Incomplete | Uses standard HTML `<form action={action} method="POST">` — **NO** fetch to `/api/forms/submit`. No JS submission handler. No success/error states. No honeypot. No siteId usage. On published sites, `action` defaults to `"#"` — form submits to current page and does nothing. **Completely non-functional out of the gate.** |

### 1.2 Critical Issues Found

| # | Issue | Severity | Component(s) | Impact |
|---|-------|----------|--------------|--------|
| 1 | **Newsletter has NO submission pipeline** | 🔴 Critical | Newsletter | Forms created by AI do nothing — `action` defaults to `"#"`, no JS handler, no API call. Dead form on every published site. |
| 2 | **ContactForm emailTo prop is decorative** | 🔴 Critical | ContactForm | ContactForm sends `_emailTo` in data but API ignores it. Only `form_settings.notify_emails` is checked. If no form_settings row → no email notification. |
| 3 | **No auto-provisioning of form_settings** | 🔴 Critical | All | When AI creates a site, no `form_settings` row is created. `notify_emails` defaults to `[]`. Result: all submissions are stored but **nobody is notified**. |
| 4 | **Form (generic) has no API integration** | 🟡 Medium | Form | Generic form wrapper uses `action`/`method` for HTML submission. No `/api/forms/submit` integration. OK for simple use cases but means Form+FormField compositions can't use the platform pipeline. |
| 5 | **Form and FormField not in KNOWN_REGISTRY_TYPES** | 🟡 Medium | Form, FormField | AI converter cannot generate these components — only ContactForm and Newsletter are in the converter's type validation Set. |
| 6 | **ContactForm styling fields missing from registry** | 🟡 Medium | ContactForm | Render accepts `inputBackgroundColor`, `inputBorderColor`, `inputTextColor`, `labelColor`, `action`, `borderRadius`, `shadow`, `padding` but registry only has 7 fields (title, subtitle, emailTo, submitText, successMessage, showPhone, showSubject). |
| 7 | **Newsletter missing styling fields in registry** | 🟡 Medium | Newsletter | Render accepts `backgroundColor`, `buttonColor`, `textColor`, `size` but registry has no styling fields. |
| 8 | **No form_settings UI in dashboard** | 🟡 Medium | All | No dedicated settings page for configuring notify_emails, webhooks, spam settings. Site owners must rely on AI or manual DB edits. |
| 9 | **No `"card"` variant in Newsletter registry** | ⚠️ Low | Newsletter | Render supports `"inline" | "stacked" | "card"` but registry only offers inline and stacked options. |
| 10 | **Newsletter has no honeypot** | ⚠️ Low | Newsletter | ContactForm has honeypot protection but Newsletter has zero spam protection. |

### 1.3 Prop Pipeline Verification

| Component | Converter Aliases | Registry Fields | Render Props | Alignment |
|-----------|------------------|-----------------|-------------|-----------|
| **Form** | ❌ Not in converter | 50+ fields, 13 groups | 71 props | ⚠️ Fields well-matched to props but component unreachable by AI |
| **FormField** | ❌ Not in converter | 45+ fields, 12 groups | 67 props | ⚠️ Same — unreachable by AI |
| **ContactForm** | 10+ aliases (L376-L535) | 7 fields (flat) | 30 props | 🔴 23 render props have no registry field (styling, siteId, action) |
| **Newsletter** | 7+ aliases (L388-L555) | 6 fields (flat) | 14 props | 🔴 8 render props have no registry field (styling, action, size) |

### 1.4 Submission Pipeline Status

| Component | Submits To | Built-in JS Handler | Honeypot | Rate Limit | Email Notifications | Success State |
|-----------|-----------|-------------------|---------|-----------|--------------------|--------------|
| **Form** | `action` prop (HTML) | `onSubmit` event (pass-through) | ❌ | ❌ | ❌ | Props only |
| **FormField** | N/A (child component) | N/A | N/A | N/A | N/A | N/A |
| **ContactForm** | `/api/forms/submit` | ✅ fetch POST | ✅ Hidden field | ✅ Server-side | ⚠️ Only if form_settings.notify_emails is non-empty | ✅ State machine |
| **Newsletter** | `action` prop (HTML) | ❌ None | ❌ | ❌ | ❌ | ❌ None |

---

## 2. Industry Benchmark Analysis

### How World-Class Platforms Handle Forms

| Feature | Typeform | HubSpot | Webflow | Squarespace | DRAMAC Current | Gap |
|---------|---------|---------|---------|-------------|----------------|-----|
| Form submission storage | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ form_submissions table | ✅ Has it |
| Email notification on submit | ✅ Automatic | ✅ Automatic | ✅ Automatic | ✅ Automatic | ⚠️ Only if form_settings configured | 🔴 Not automatic |
| Zero-config forms | ✅ Works on create | ✅ Works on create | ✅ Works on create | ✅ Works on create | ❌ Requires form_settings row | 🔴 Not zero-config |
| Honeypot spam protection | ✅ | ✅ | ✅ | ✅ | ⚠️ ContactForm only | 🔴 Newsletter unprotected |
| CAPTCHA option | ✅ reCAPTCHA | ✅ reCAPTCHA | ✅ reCAPTCHA/hCaptcha | ✅ reCAPTCHA | ❌ Not implemented | 🟡 Future |
| Webhook integrations | ✅ | ✅ | ✅ Zapier | ❌ | ✅ form_webhooks table | ✅ Has it |
| Success redirect | ✅ | ✅ | ✅ | ✅ | ✅ redirect_url in form_settings | ✅ Has it |
| Submission dashboard | ✅ | ✅ | ✅ | ✅ | ✅ Dashboard exists | ✅ Has it |
| Multi-step forms | ✅ Core feature | ✅ | ❌ | ❌ | ❌ | 🟡 Future |
| Conditional fields | ✅ | ✅ | ✅ | ❌ | ❌ | 🟡 Future |
| File upload in forms | ✅ | ✅ | ✅ | ✅ | ⚠️ FormField supports file type | ✅ Partial |
| Newsletter signup | ✅ | ✅ | ✅ | ✅ | ⚠️ Component exists but non-functional | 🔴 Broken |
| Custom thank-you message | ✅ | ✅ | ✅ | ✅ | ✅ successMessage prop | ✅ Has it |
| Export to CSV | ✅ | ✅ | ✅ | ✅ | ✅ /api/forms/export | ✅ Has it |
| Dark mode forms | ✅ | ⚠️ | ✅ | ✅ | ⚠️ No CSS variable colours | 🔴 Needs work |

### Key Takeaways

1. **The submission infrastructure is 90% built** — storage, notifications, webhooks, spam protection all exist. The gap is **wiring form components to use the infrastructure**.
2. **Zero-config is the industry standard**. Every competitor makes forms work immediately. DRAMAC's current "empty notify_emails default" means forms silently fail to notify.
3. **Newsletter is the biggest gap** — competitors all have functional newsletter signups. DRAMAC's Newsletter component is purely cosmetic.
4. **ContactForm is close to production-ready** — just needs the `emailTo` prop to actually route emails and a fallback to site owner email.

---

## 3. Architecture Principles

### 3.1 Every Form Must Submit to `/api/forms/submit`

```typescript
// ❌ WRONG — HTML form action to nowhere
<form action="#" method="POST">

// ❌ WRONG — External endpoint dependency
<form action="https://mailchimp.com/api/..." method="POST">

// ✅ CORRECT — Platform submission pipeline
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const res = await fetch("/api/forms/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ siteId, formId, data, honeypot }),
  });
};
```

**Rule:** All platform-hosted forms MUST use `/api/forms/submit`. This ensures: submissions are stored, emails are sent, webhooks fire, spam is caught, rate limits apply, and analytics work. No exceptions.

### 3.2 siteId Flows Automatically

```
renderer.tsx L218-228:
  let injectedProps = {
    ...component.props,
    siteId: component.props?.siteId || siteId,  // ← auto-injected
  };
```

Every component on a published site receives `siteId` automatically. Form components should use this prop — never require manual siteId configuration.

### 3.3 Email Notification Fallback Chain

```
1. form_settings.notify_emails (if row exists and non-empty)
   ↓ fallback
2. data._emailTo (from ContactForm emailTo prop)
   ↓ fallback
3. site owner's email (from sites table → users.email)
   ↓ fallback
4. agency admin email
   ↓ if all empty
5. Store submission silently (no notification, but data is preserved)
```

**Rule:** A form submission must ALWAYS be stored. Email notifications should cascade through the fallback chain. The current API only checks step 1 and gives up — this must be enhanced.

### 3.4 Honeypot on Every Public Form

```tsx
// Required on ContactForm, Newsletter, and any Form used on published sites
<input
  type="text"
  name="_honeypot"
  tabIndex={-1}
  autoComplete="off"
  style={{
    position: "absolute",
    left: "-9999px",
    opacity: 0,
    height: 0,
    width: 0,
  }}
  aria-hidden="true"
/>
```

**Rule:** Every form that accepts user input on a public page must include the honeypot field. The submission handler must check it before processing.

### 3.5 Inline Styles for All Colours

```typescript
// ❌ WRONG — Tailwind colour class
className="bg-blue-600 text-white"

// ✅ CORRECT — Inline style with CSS variable fallback
style={{
  backgroundColor: buttonColor || 'var(--color-primary, #3b82f6)',
  color: buttonTextColor || 'var(--color-primary-foreground, #ffffff)',
}}
```

**Rule:** All colours MUST use inline `style={{}}` with CSS variable fallbacks. Tailwind is ONLY for structural properties (padding, flex, grid, border-radius tokens, transitions).

### 3.6 Semantic HTML Always

```html
<!-- ✅ Correct form structure -->
<form action="/api/forms/submit" method="POST" novalidate>
  <label for="name">Name</label>
  <input id="name" name="name" type="text" required aria-required="true" />
  <button type="submit">Send</button>
</form>

<!-- ❌ Never do this -->
<div class="form-wrapper">
  <div class="label">Name</div>
  <div class="input" contenteditable="true"></div>
  <div class="button" onclick="submit()">Send</div>
</div>
```

---

## 4. Component Deep Dive — Form (Container)

### 4.1 Current State

| Property | Value |
|----------|-------|
| **Type** | `"Form"` |
| **File** | `renders.tsx` L15892 (interface) → L15973 (export) |
| **Registry** | `core-components.ts` L12513 (`defineComponent`) |
| **Metadata** | `component-metadata.ts` L581 |
| **Converter** | ❌ Not in `typeMap` or `KNOWN_REGISTRY_TYPES` |
| **Category** | `"forms"` |
| **acceptsChildren** | `true` (isContainer: true) |
| **Props** | 71 (interface) |
| **Registry Fields** | 50+ across 13 field groups |
| **Submission** | Generic: `action` prop + `onSubmit` event handler, no `/api/forms/submit` |

### 4.2 Props Interface Summary (L15892-L15971)

| Group | Props | Count |
|-------|-------|-------|
| Content | `children`, `title`, `description` | 3 |
| Form Settings | `action`, `method`, `enctype`, `novalidate`, `autocomplete` | 5 |
| Layout | `layout` (5 options), `gap` (5 sizes), `labelPosition` (3), `alignItems` (3) | 4 |
| Sizing | `maxWidth` (7 options), `fullWidth` | 2 |
| Appearance | `backgroundColor`, `padding`, `borderRadius`, `shadow`, `border`, `borderColor`, `borderWidth` | 7 |
| Header Styling | `showHeader`, `headerAlign`, `titleSize`, `titleColor`, `descriptionColor`, `headerSpacing` | 6 |
| Dividers | `showDividers`, `dividerColor` | 2 |
| Submit Button | `showSubmitButton`, `submitText`, `submitVariant`, `submitSize`, `submitFullWidth`, `submitColor`, `submitPosition` | 7 |
| Reset Button | `showResetButton`, `resetText` | 2 |
| Loading States | `isLoading`, `loadingText`, `disabled` | 3 |
| Messages | `successMessage`, `errorMessage`, `showSuccessIcon`, `showErrorIcon` | 4 |
| Animation | `animateOnLoad`, `animationType` | 2 |
| Misc | `id`, `className`, `onSubmit` | 3 |

### 4.3 Registry Analysis

The Form registry at L12513-L12949 is **comprehensive** — 50+ fields across 13 field groups with proper `type`, `label`, `options`, and `defaultValue` definitions. All field names match the render prop names.

**defaultProps** (L12920-L12932):
```typescript
{
  method: "POST",
  layout: "vertical",
  gap: "md",
  maxWidth: "full",
  padding: "none",
  borderRadius: "none",
  shadow: "none",
  showSubmitButton: true,
  submitText: "Submit",
  submitVariant: "primary",
  submitSize: "md",
  submitColor: "",
}
```

**AI Section** (L12933-L12949):
```typescript
ai: {
  canModify: ["title", "description", "submitText", "successMessage",
              "errorMessage", "layout", "gap", "padding", "backgroundColor"],
}
```

### 4.4 Gap Analysis

| Issue | Details | Fix Required |
|-------|---------|-------------|
| Not in converter | AI cannot generate `Form` components | Add to `KNOWN_REGISTRY_TYPES` + typeMap aliases |
| No `/api/forms/submit` integration | `action` defaults to `"#"`, `onSubmit` is pass-through | Add optional `enablePlatformSubmission` prop + fetch handler |
| No `siteId` prop in interface | siteId is injected by renderer but interface doesn't declare it | Add `siteId?: string` to FormProps |
| No `formId` prop | Needed for `/api/forms/submit` | Add `formId?: string` to FormProps |
| No honeypot | Generic forms have no spam protection | Add honeypot field when `enablePlatformSubmission` is true |

### 4.5 Enhancement Plan

**Add to FormProps interface:**
```typescript
// New props for platform submission integration
siteId?: string;           // Auto-injected by renderer.tsx
formId?: string;           // Identifier for this form instance
enablePlatformSubmission?: boolean;  // When true, submits to /api/forms/submit
```

**Add to FormRender function body:**
```typescript
// When enablePlatformSubmission is true:
// 1. Override onSubmit with fetch to /api/forms/submit
// 2. Collect all named inputs from children
// 3. Include honeypot check
// 4. Show success/error states based on API response
```

---

## 5. Component Deep Dive — FormField (Input)

### 5.1 Current State

| Property | Value |
|----------|-------|
| **Type** | `"FormField"` |
| **File** | `renders.tsx` L16296 (interface) → L16426 (export) |
| **Registry** | `core-components.ts` L12951 (`defineComponent`) |
| **Metadata** | `component-metadata.ts` L593 |
| **Converter** | ❌ Not in `typeMap` or `KNOWN_REGISTRY_TYPES` |
| **Category** | `"forms"` |
| **Props** | 67 (interface) |
| **Registry Fields** | 45+ across 12 field groups |
| **Input Types** | 17: text, email, password, tel, url, number, date, time, datetime-local, textarea, select, checkbox, radio, range, file, color, hidden |

### 5.2 Props Interface Summary (L16296-L16425)

| Group | Props | Count |
|-------|-------|-------|
| Label & Name | `label`, `name` | 2 |
| Input Settings | `type` (17 types), `placeholder`, `value`, `defaultValue` | 4 |
| Validation | `required`, `disabled`, `readonly`, `min`, `max`, `step`, `minLength`, `maxLength`, `pattern` | 9 |
| Select/Radio | `options` (array of {value, label, disabled}) | 1 |
| Textarea | `rows`, `cols`, `resize` (4 options) | 3 |
| File | `accept`, `multiple` | 2 |
| Autocomplete | `autocomplete`, `autofocus`, `spellcheck` | 3 |
| Help & Error | `helpText`, `error`, `success`, `showCharCount` | 4 |
| Styling | `size` (5), `variant` (4), `fullWidth`, `borderRadius`, `backgroundColor`, `textColor`, `borderColor`, `focusBorderColor` | 8 |
| Label Styling | `hideLabel`, `labelPosition`, `labelSize`, `labelColor`, `labelWeight`, `requiredIndicator` | 6 |
| Icon | `iconEmoji`, `iconPosition`, `iconColor` | 3 |
| Prefix/Suffix | `prefix`, `suffix`, `prefixColor`, `suffixColor` | 4 |
| Features | `showClearButton`, `showPasswordToggle`, `showCounter` | 3 |
| States | `showSuccessState`, `showErrorState` | 2 |
| Misc | `id`, `className`, `containerClassName`, `inputClassName`, `onChange`, `onBlur`, `onFocus` | 7 |

### 5.3 Quality Assessment

FormFieldRender is the **strongest component** in the forms category. It has:

- ✅ 17 input types with correct HTML elements (`<input>`, `<textarea>`, `<select>`, radio/checkbox groups)
- ✅ 4 styling variants (default, filled, underline, ghost)
- ✅ Proper label→input association via generated IDs
- ✅ Help text and error message display
- ✅ Character count display
- ✅ Password visibility toggle
- ✅ Clear button
- ✅ Prefix/suffix adornments
- ✅ Icon support via emoji

### 5.4 Gap Analysis

| Issue | Details | Fix Required |
|-------|---------|-------------|
| Not in converter | AI cannot generate FormField directly | Add to `KNOWN_REGISTRY_TYPES` (as child of Form only) |
| No ARIA attributes | Missing `aria-required`, `aria-invalid`, `aria-describedby` | Add to all input elements |
| No icon name system | Uses `iconEmoji` (emoji) not Lucide icon names | Consider adding `iconName` prop (consistent with Button) |
| No dark mode colours | Uses Tailwind bg/border classes | Migrate to inline styles with CSS var fallbacks |
| No input masking | No phone/credit card/date format masks | Future enhancement |

---

## 6. Component Deep Dive — ContactForm (Pre-Built)

### 6.1 Current State

| Property | Value |
|----------|-------|
| **Type** | `"ContactForm"` |
| **File** | `renders.tsx` L16887 (interface) → L16917 (export) |
| **Registry** | `core-components.ts` L13330 (`defineComponent`) |
| **Metadata** | `component-metadata.ts` L604 |
| **Converter** | ✅ 10+ aliases in typeMap, in `KNOWN_REGISTRY_TYPES` at L783 |
| **Category** | `"forms"` |
| **Props** | 30 (interface) |
| **Registry Fields** | 7 (flat, no groups) |
| **Submission** | ✅ Built-in fetch to `/api/forms/submit` |

### 6.2 Props Interface (L16887-L16916)

```typescript
export interface ContactFormProps {
  // Content
  title?: string;                    // "Contact Us"
  subtitle?: string;
  nameLabel?: string;                // "Full Name"
  emailLabel?: string;               // "Email Address"
  phoneLabel?: string;               // "Phone Number"
  subjectLabel?: string;             // "Subject"
  messageLabel?: string;             // "Message"
  submitText?: string;               // "Send Message"

  // Field Visibility
  showPhone?: boolean;
  showSubject?: boolean;

  // Appearance
  backgroundColor?: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  padding?: "sm" | "md" | "lg";
  buttonColor?: string;
  buttonTextColor?: string;
  textColor?: string;
  inputBackgroundColor?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
  labelColor?: string;

  // Submission
  successMessage?: string;
  action?: string;                   // Not used — fetch overrides it
  siteId?: string;                   // Auto-injected by renderer.tsx
  emailTo?: string;                  // ⚠️ Sent in data but API ignores it

  // Misc
  id?: string;
  className?: string;
}
```

### 6.3 Submission Flow (L16958-L17030)

```
User fills form → clicks Submit
  ↓
handleSubmit(e):
  1. e.preventDefault()
  2. Read FormData from form element
  3. Check honeypot — if filled, fake success + return
  4. Collect all non-underscore fields into data object
  5. If emailTo prop exists, add data._emailTo = emailTo
  6. POST /api/forms/submit:
     { siteId, formId: "contact-form", data, honeypot }
  7. On success → setStatus("success"), reset form
  8. On error → setStatus("error"), show error message
```

### 6.4 Registry vs Render Disconnect

| In Render (30 props) | In Registry (7 fields) | Status |
|---------------------|----------------------|--------|
| `title` | ✅ `title` | Aligned |
| `subtitle` | ✅ `subtitle` | Aligned |
| `emailTo` | ✅ `emailTo` | Aligned |
| `submitText` | ✅ `submitText` | Aligned |
| `successMessage` | ✅ `successMessage` | Aligned |
| `showPhone` | ✅ `showPhone` | Aligned |
| `showSubject` | ✅ `showSubject` | Aligned |
| `nameLabel` | ❌ Missing | Not configurable in sidebar |
| `emailLabel` | ❌ Missing | Not configurable in sidebar |
| `phoneLabel` | ❌ Missing | Not configurable in sidebar |
| `subjectLabel` | ❌ Missing | Not configurable in sidebar |
| `messageLabel` | ❌ Missing | Not configurable in sidebar |
| `backgroundColor` | ❌ Missing | Not configurable |
| `borderRadius` | ❌ Missing | Not configurable |
| `shadow` | ❌ Missing | Not configurable |
| `padding` | ❌ Missing | Not configurable |
| `buttonColor` | ❌ Missing | Not configurable |
| `buttonTextColor` | ❌ Missing | Not configurable |
| `textColor` | ❌ Missing | Not configurable |
| `inputBackgroundColor` | ❌ Missing | Not configurable |
| `inputBorderColor` | ❌ Missing | Not configurable |
| `inputTextColor` | ❌ Missing | Not configurable |
| `labelColor` | ❌ Missing | Not configurable |
| `siteId` | ❌ Missing (auto-injected) | OK — not user-configurable |
| `action` | ❌ Missing | Not needed (uses fetch) |

**Result: 23 of 30 render props have no registry field.** The AI can set title, subtitle, emailTo, submitText, successMessage, showPhone, showSubject — but zero styling control.

### 6.5 Critical `emailTo` Bug

The ContactFormRender sends `emailTo` in the submission data:
```typescript
if (emailTo) {
  data._emailTo = emailTo;
}
```

But the API route (`/api/forms/submit/route.ts`) **never reads `_emailTo`**. It only sends notifications to `form_settings.notify_emails`:
```typescript
const emails = settings.notify_emails as string[];
if (!emails || emails.length === 0) {
  return; // ← No fallback to _emailTo!
}
```

**Result:** The `emailTo` field in the registry sidebar is misleading. Setting it does nothing for email delivery.

### 6.6 Enhancement Plan

1. **Fix emailTo routing** — API must check `data._emailTo` as fallback
2. **Add registry fields** for all 23 missing render props (grouped into Content, Appearance, Input Styling)
3. **Add formId prop** to allow multiple contact forms per site with separate settings
4. **Add AI canModify** for styling props

---

## 7. Component Deep Dive — Newsletter (Signup)

### 7.1 Current State

| Property | Value |
|----------|-------|
| **Type** | `"Newsletter"` |
| **File** | `renders.tsx` L17225 (interface) → L17241 (export) |
| **Registry** | `core-components.ts` L13376 (`defineComponent`) |
| **Metadata** | `component-metadata.ts` L616 |
| **Converter** | ✅ 7+ aliases in typeMap, in `KNOWN_REGISTRY_TYPES` at L784 |
| **Category** | `"forms"` |
| **Props** | 14 (interface) |
| **Registry Fields** | 6 (flat, no groups) |
| **Submission** | ❌ Non-functional: `<form action={action} method="POST">` where action defaults to `"#"` |

### 7.2 Props Interface (L17225-L17240)

```typescript
export interface NewsletterProps {
  title?: string;                     // "Subscribe to our newsletter"
  description?: string;               // "Get the latest news..."
  placeholder?: string;               // "Enter your email"
  buttonText?: string;                // "Subscribe"
  variant?: "inline" | "stacked" | "card";
  backgroundColor?: string;
  buttonColor?: string;
  textColor?: string;
  size?: "sm" | "md" | "lg";
  successMessage?: string;            // Never displayed — no success state!
  action?: string;                    // Defaults to "#" — goes nowhere
  id?: string;
  className?: string;
}
```

### 7.3 The Problem

NewsletterRender uses a standard HTML `<form>` tag with `action` and `method="POST"`:

```tsx
<form action={action} method="POST" className="...">
  <input type="email" name="email" placeholder={placeholder} required />
  <button type="submit">{buttonText}</button>
</form>
```

There is:
- ❌ No `handleSubmit` function
- ❌ No `fetch` to `/api/forms/submit`
- ❌ No `siteId` usage
- ❌ No honeypot field
- ❌ No success/error state management
- ❌ No `successMessage` display (prop exists but is never used)
- ❌ No loading state

When `action` defaults to `"#"`, submitting the form reloads the current page with a `?email=...` query parameter. On published sites, this is a **completely broken user experience**.

### 7.4 Registry vs Render Disconnect

| In Render (14 props) | In Registry (6 fields) | Status |
|---------------------|----------------------|--------|
| `title` | ✅ `title` | Aligned |
| `description` | ✅ `subtitle` → `description` | ⚠️ Registry says "Subtitle", render calls it "description" |
| `placeholder` | ✅ `placeholder` | Aligned |
| `buttonText` | ✅ `submitText` → `buttonText` | ⚠️ Registry says "submitText", needs `buttonText` |
| `successMessage` | ✅ `successMessage` | Aligned (but never displayed) |
| `variant` | ✅ `layout` → partial | ⚠️ Registry offers inline/stacked, render also has "card" |
| `backgroundColor` | ❌ Missing | Not configurable |
| `buttonColor` | ❌ Missing | Not configurable |
| `textColor` | ❌ Missing | Not configurable |
| `size` | ❌ Missing | Not configurable |
| `action` | ❌ Missing | Not configurable |
| `id` | ❌ Missing | Not configurable |
| `className` | ❌ Missing | Not configurable |

**Registry field name mismatches (critical):**
- Registry `subtitle` → Render expects `description` (name mismatch!)
- Registry `submitText` → Render expects `buttonText` (name mismatch!)
- Registry `layout` → Render expects `variant` (name mismatch!)

> ⚠️ **These are BREAKING mismatches.** The converter stores the registry field name. The render destructures the prop name. If they don't match, the prop is lost. Need to verify if the registry defaultValue keys match the render param names.

Wait — checking the registry at L13419-L13425:
```typescript
defaultProps: {
  title: "Subscribe to our newsletter",
  placeholder: "Enter your email",
  submitText: "Subscribe",           // ← Render expects buttonText
  successMessage: "Thanks for subscribing!",
  layout: "inline",                  // ← Render expects variant
}
```

**Confirmed:** `submitText` and `layout` are stored as props but the render destructures `buttonText` and `variant`. These props are silently lost. The newsletter button always says "Subscribe" (hardcoded default) regardless of what's set in the sidebar.

### 7.5 Enhancement Plan (Complete Rewrite Required)

1. **Add fetch-based submission** to `/api/forms/submit` (matching ContactFormRender pattern)
2. **Add honeypot field** for spam protection
3. **Add `siteId` prop** (auto-injected by renderer.tsx)
4. **Add success/error state machine** (idle → loading → success/error)
5. **Fix registry field names**: `submitText` → `buttonText`, `layout` → `variant`, `subtitle` → `description`
6. **Add `"card"` option** to variant select in registry
7. **Add registry fields** for `backgroundColor`, `buttonColor`, `textColor`, `size`
8. **Actually display `successMessage`** on successful submission

---

## 8. "Out of the Gate" Submission Architecture

> This section addresses the core requirement: **every form created by the AI Designer must have its submission working immediately, with zero manual configuration.**

### 8.1 The Current Gap

When the AI Designer creates a site with a ContactForm:

1. ✅ The component is rendered on the published site
2. ✅ `siteId` is auto-injected by `renderer.tsx`
3. ✅ ContactFormRender POSTs to `/api/forms/submit`
4. ✅ The API validates the site and stores the submission
5. ❌ **No `form_settings` row exists** for this site+form
6. ❌ `notify_emails` defaults to `[]` (empty array)
7. ❌ **Nobody receives an email notification**
8. ❌ The site owner has no idea someone filled out their contact form

The submission is stored in the database but it's effectively invisible — no notification, no webhook, no indication to the site owner.

### 8.2 Solution: Three-Layer Fallback for Email Notifications

**Modify `/api/forms/submit/route.ts` sendNotifications function:**

```typescript
async function sendNotifications(
  supabase: SupabaseAdmin,
  submission: Record<string, unknown>,
  settings: Record<string, unknown>,
  site: { id: string; agency_id: string },
): Promise<void> {
  let emails = (settings.notify_emails as string[]) || [];

  // Layer 1: form_settings.notify_emails (explicit configuration)
  if (emails.length > 0) {
    await sendToRecipients(emails, submission, settings, site);
    return;
  }

  // Layer 2: emailTo from form data (ContactForm emailTo prop)
  const formData = submission.data as Record<string, unknown>;
  if (formData._emailTo && typeof formData._emailTo === "string") {
    await sendToRecipients([formData._emailTo], submission, settings, site);
    return;
  }

  // Layer 3: Site owner's email (the person who created the site)
  const { data: siteData } = await supabase
    .from("sites")
    .select("user_id")
    .eq("id", site.id)
    .single();

  if (siteData?.user_id) {
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", siteData.user_id)
      .single();

    if (user?.email) {
      await sendToRecipients([user.email], submission, settings, site);
      return;
    }
  }

  // Layer 4: No recipient found — submission stored but no notification
  console.log("[FormSubmit] No notification recipients found for site:", site.id);
}
```

### 8.3 Solution: Auto-Provision form_settings on Site Creation

When the AI Designer creates a new site, the site creation pipeline should also create default `form_settings` entries:

```typescript
// In site creation flow (after site is inserted into sites table):
await supabase.from("form_settings").insert([
  {
    site_id: newSiteId,
    form_id: "contact-form",
    form_name: "Contact Form",
    success_message: "Thank you for your message! We'll get back to you soon.",
    notify_on_submission: true,
    notify_emails: [siteOwnerEmail],  // ← Pull from creator's email
    enable_honeypot: true,
    enable_rate_limit: true,
    rate_limit_per_hour: 20,
  },
  {
    site_id: newSiteId,
    form_id: "newsletter",
    form_name: "Newsletter Signup",
    success_message: "Thanks for subscribing!",
    notify_on_submission: true,
    notify_emails: [siteOwnerEmail],
    enable_honeypot: true,
    enable_rate_limit: true,
    rate_limit_per_hour: 50,
  },
]);
```

### 8.4 Solution: Newsletter Submission Rewrite

NewsletterRender must be rewritten to use `/api/forms/submit`:

```tsx
export function NewsletterRender({
  title = "Subscribe to our newsletter",
  description = "Get the latest news and updates delivered to your inbox.",
  placeholder = "Enter your email",
  buttonText = "Subscribe",
  variant = "inline",
  backgroundColor,
  buttonColor = "",
  textColor,
  size = "md",
  successMessage = "Thanks for subscribing!",
  siteId,          // ← NEW: auto-injected
  id,
  className,
}: NewsletterProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");

    const formData = new FormData(e.currentTarget);

    // Honeypot check
    if (formData.get("_honeypot")) {
      setStatus("success");
      return;
    }

    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          formId: "newsletter",
          data: { email: formData.get("email") },
          honeypot: formData.get("_honeypot") || "",
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setErrorMsg(result.error || "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  // ... render form with honeypot, success/error states, etc.
}
```

### 8.5 Solution: Form (Generic) Platform Integration

Add an `enablePlatformSubmission` toggle to Form:

```tsx
// When enablePlatformSubmission is true:
// 1. Override the onSubmit handler
// 2. Collect all named child inputs via FormData
// 3. POST to /api/forms/submit with siteId + formId
// 4. Include honeypot
// 5. Show success/error based on API response

// This allows Form+FormField compositions to submit through
// the platform pipeline without custom code
```

### 8.6 Complete "Out of the Gate" Checklist

| Requirement | ContactForm | Newsletter | Form (generic) |
|-------------|-------------|------------|----------------|
| Submits to `/api/forms/submit` | ✅ Has it | ❌ → ADD | ❌ → ADD (opt-in) |
| `siteId` flows automatically | ✅ Via renderer.tsx | ❌ → ADD prop | ✅ Via renderer.tsx |
| `formId` sent to API | ✅ `"contact-form"` | ❌ → ADD `"newsletter"` | ❌ → ADD configurable |
| Honeypot protection | ✅ Has it | ❌ → ADD | ❌ → ADD |
| Success state displayed | ✅ Has it | ❌ → ADD | ⚠️ Props exist, need state machine |
| Error state displayed | ✅ Has it | ❌ → ADD | ⚠️ Props exist, need state machine |
| Email delivery without config | ❌ → FIX (fallback chain) | ❌ → FIX (fallback chain) | ❌ → FIX (fallback chain) |
| form_settings auto-created | ❌ → ADD | ❌ → ADD | N/A |
| Submission stored in DB | ✅ Has it | ❌ → ADD | ❌ → ADD (opt-in) |

---

## 9. Validation & Error Handling

### 9.1 Current Validation Approach

Form components currently use **native HTML5 validation attributes only**:
- `required`, `pattern`, `min`, `max`, `minLength`, `maxLength`
- No Zod schemas on the client side
- No React Hook Form integration in render components
- Server-side validation is basic (required fields check in API)

### 9.2 Recommended Validation Strategy

**Keep native HTML5 validation as the primary mechanism.** Do NOT add React Hook Form or Zod to the render components because:

1. Render components must be lightweight (they're rendered in the studio canvas)
2. The studio canvas is an iframe — heavy validation libraries add bundle size
3. HTML5 validation provides sufficient UX for generated forms
4. Server-side validation in `/api/forms/submit` is the security boundary

**Enhance the existing approach:**

```tsx
// FormFieldRender — add ARIA attributes for accessibility
<input
  id={fieldId}
  name={name}
  type={type}
  required={required}
  aria-required={required}
  aria-invalid={!!error}
  aria-describedby={helpText ? `${fieldId}-help` : error ? `${fieldId}-error` : undefined}
  {...otherProps}
/>

{error && (
  <p id={`${fieldId}-error`} role="alert" className="text-sm" style={{ color: 'var(--color-destructive, #dc2626)' }}>
    {error}
  </p>
)}

{helpText && (
  <p id={`${fieldId}-help`} className="text-sm text-muted">
    {helpText}
  </p>
)}
```

### 9.3 Server-Side Validation (Already Exists)

The `/api/forms/submit` route validates:
- `siteId` is present and valid (site exists in DB)
- `formId` is present
- `data` is an object
- Honeypot field is empty
- Rate limit is not exceeded
- Content is not spam

### 9.4 Email Validation

ContactFormRender uses `type="email"` on the email input — browser handles format validation. For enhanced server-side validation, the API could validate email format, but this is a future enhancement.

---

## 10. Accessibility & WCAG Compliance

### 10.1 Current State

| Requirement | FormField | ContactForm | Newsletter | Status |
|------------|-----------|-------------|------------|--------|
| `<label>` on every input | ✅ `htmlFor` | ✅ Label elements | ❌ No label on email input | ⚠️ Fix Newsletter |
| `aria-required` | ❌ Missing | ❌ Missing | ❌ Missing | 🔴 Add to all |
| `aria-invalid` | ❌ Missing | ❌ Missing | ❌ Missing | 🔴 Add to all |
| `aria-describedby` | ❌ Missing | ❌ Missing | ❌ Missing | 🔴 Add to all |
| Focus indicators | ✅ `focus:ring-2` | ✅ `focus:ring-2` | ✅ `focus:ring-2` | ✅ OK |
| Keyboard navigation | ✅ Native elements | ✅ Native elements | ✅ Native elements | ✅ OK |
| Error announcements | ❌ No `role="alert"` | ❌ No `role="alert"` | ❌ No error state | 🔴 Add to all |
| Submit button semantic | ✅ `<button type="submit">` | ✅ `<button type="submit">` | ✅ `<button type="submit">` | ✅ OK |
| Honeypot hidden from AT | N/A | ✅ `aria-hidden="true"` | N/A (no honeypot) | ✅ OK |

### 10.2 Required ARIA Enhancements

Every form input must have:

```tsx
// On every <input>, <textarea>, <select>:
aria-required={required}
aria-invalid={hasError}
aria-describedby={getDescribedBy(fieldId, helpText, error)}

// On error messages:
<p role="alert" id={`${fieldId}-error`}>Error text</p>

// On success messages (form-level):
<div role="status" aria-live="polite">
  {successMessage}
</div>

// On loading states:
<button type="submit" aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? loadingText : submitText}
</button>
```

### 10.3 Newsletter Label Fix

```tsx
// ❌ Current — no label
<input type="email" name="email" placeholder={placeholder} required />

// ✅ Fix — add visually hidden label
<label htmlFor={`newsletter-email-${id}`} className="sr-only">
  Email address
</label>
<input
  id={`newsletter-email-${id}`}
  type="email"
  name="email"
  placeholder={placeholder}
  required
  aria-required="true"
/>
```

---

## 11. Dark Mode & Theming

### 11.1 Current State

Form components use a mix of:
- Inline `style={{}}` for user-configurable colours (backgroundColor, buttonColor, textColor) — ✅ These work in dark mode
- Tailwind classes for structural colours (borders, backgrounds, focus rings) — ❌ These don't adapt to dark mode

### 11.2 Problem Areas

| Component | Issue | Current | Fix |
|-----------|-------|---------|-----|
| FormField | Input border | `border-gray-300` | `style={{ borderColor: borderColor \|\| 'var(--color-border, #d1d5db)' }}` |
| FormField | Input background | `bg-white` / `bg-gray-50` | `style={{ backgroundColor: backgroundColor \|\| 'var(--color-input, #ffffff)' }}` |
| FormField | Placeholder text | `placeholder-gray-400` | Use CSS `::placeholder` with CSS variable |
| ContactForm | Input border | `border-gray-200/300` | Same as FormField |
| ContactForm | Error text | `text-red-600` | `style={{ color: 'var(--color-destructive, #dc2626)' }}` |
| Newsletter | Input border | `border-...` | Use CSS variable |
| All | Focus ring | `focus:ring-blue-500` | `focus:ring-[var(--color-primary)]` or inline |

### 11.3 CSS Variables for Forms

```css
/* Form design tokens — injected by theme system */
--color-input: #ffffff;              /* Input background */
--color-input-foreground: #111827;   /* Input text */
--color-input-border: #d1d5db;       /* Input border */
--color-input-focus: #3b82f6;        /* Focus ring/border */
--color-input-placeholder: #9ca3af;  /* Placeholder text */
--color-label: #374151;             /* Label text */
--color-help-text: #6b7280;         /* Help/description text */
--color-destructive: #dc2626;       /* Error states */
--color-success: #16a34a;           /* Success states */
--color-form-bg: transparent;       /* Form container background */
```

### 11.4 Dark Mode Detection Approach

ContactFormRender already has a dark mode detection check in its render body. This pattern should be standardised:

```tsx
// Detect dark background for adaptive text colours
const isDark = backgroundColor
  ? isColorDark(backgroundColor)
  : false;
```

For components without explicit backgroundColor, use the CSS variable approach — CSS variables automatically resolve to dark-mode values when the parent theme sets them.

---

## 12. AI Designer Integration

### 12.1 Current AI Capability

| Component | AI Can Generate? | AI Can Modify? | AI Fields |
|-----------|-----------------|---------------|-----------|
| **Form** | ❌ Not in converter | ✅ If manually placed | title, description, submitText, successMessage, errorMessage, layout, gap, padding, backgroundColor |
| **FormField** | ❌ Not in converter | ✅ If manually placed | ❌ No ai.canModify defined |
| **ContactForm** | ✅ 10+ aliases | ✅ | title, subtitle, submitText, successMessage |
| **Newsletter** | ✅ 7+ aliases | ✅ | title, subtitle, submitText, successMessage |

### 12.2 AI Designer Context for Forms

When the AI Designer generates a contact page, it should:

1. Use `ContactForm` (not `Form` + multiple `FormField` children) — simpler, works out of the gate
2. Set `title` contextually (e.g., "Get in Touch", "Book a Consultation", "Send us a Message")
3. Set `submitText` contextually (e.g., "Send Message", "Book Now", "Get Started")
4. Set `successMessage` contextually
5. Set `showPhone` and `showSubject` based on business type
6. Leave `siteId` empty — renderer.tsx will inject it

When generating a newsletter section (often in footer or as a standalone CTA):

1. Use `Newsletter` component
2. Set `title` contextually
3. Set `buttonText` contextually (e.g., "Subscribe", "Join", "Sign Up")
4. Set `variant` based on context (inline for footers, card for standalone)

### 12.3 Converter Special Handling

The converter already has special handling for Newsletter at L2009-L2020:

```typescript
if (type === "Newsletter") {
  return {
    type: "Newsletter",
    props: {
      title: block.props?.title || "Stay Updated",
      description: block.props?.subtitle ||
        "Subscribe to our newsletter for the latest updates.",
      buttonText: block.props?.buttonText || "Subscribe",
      variant: block.props?.layout || "inline",
    },
  };
}
```

> Note: This converter handling correctly maps `layout` → `variant` and `subtitle` → `description`. But the **registry** still uses the wrong field names (submitText, layout, subtitle). The converter fixes it, but the sidebar editor is broken.

### 12.4 Required AI Enhancements

1. **Add Form to KNOWN_REGISTRY_TYPES** — allow AI to generate custom forms
2. **Add FormField to KNOWN_REGISTRY_TYPES** — allow AI to generate form fields
3. **Add converter typeMap entries** for Form and FormField aliases
4. **Enhance ContactForm ai.canModify** to include styling props
5. **Enhance Newsletter ai.canModify** to include styling props

---

## 13. Registry & Converter Alignment

### 13.1 ContactForm — Missing Registry Fields

**Add these fields to ContactForm's `defineComponent` at L13330:**

```typescript
fields: {
  // Existing
  title: { type: "text", label: "Title", defaultValue: "Contact Us" },
  subtitle: { type: "textarea", label: "Subtitle" },
  emailTo: { type: "text", label: "Send To Email" },
  submitText: { type: "text", label: "Submit Button Text", defaultValue: "Send Message" },
  successMessage: { type: "text", label: "Success Message", defaultValue: "Thanks! We'll be in touch." },
  showPhone: { type: "toggle", label: "Show Phone Field", defaultValue: true },
  showSubject: { type: "toggle", label: "Show Subject Field", defaultValue: true },

  // NEW — Label Customisation
  nameLabel: { type: "text", label: "Name Label", defaultValue: "Full Name" },
  emailLabel: { type: "text", label: "Email Label", defaultValue: "Email Address" },
  phoneLabel: { type: "text", label: "Phone Label", defaultValue: "Phone Number" },
  subjectLabel: { type: "text", label: "Subject Label", defaultValue: "Subject" },
  messageLabel: { type: "text", label: "Message Label", defaultValue: "Message" },

  // NEW — Appearance
  backgroundColor: { type: "color", label: "Background Color" },
  borderRadius: {
    type: "select", label: "Border Radius",
    options: [
      { label: "None", value: "none" },
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
      { label: "XL", value: "xl" },
    ],
    defaultValue: "lg",
  },
  shadow: {
    type: "select", label: "Shadow",
    options: [
      { label: "None", value: "none" },
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
    ],
    defaultValue: "none",
  },
  padding: {
    type: "select", label: "Padding",
    options: [
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
    ],
    defaultValue: "md",
  },

  // NEW — Colour Overrides
  buttonColor: { type: "color", label: "Button Color" },
  buttonTextColor: { type: "color", label: "Button Text Color" },
  textColor: { type: "color", label: "Text Color" },
  inputBackgroundColor: { type: "color", label: "Input Background" },
  inputBorderColor: { type: "color", label: "Input Border Color" },
  inputTextColor: { type: "color", label: "Input Text Color" },
  labelColor: { type: "color", label: "Label Color" },
},
```

### 13.2 Newsletter — Fix Field Name Mismatches + Add Fields

**Replace Newsletter `defineComponent` fields at L13377:**

```typescript
fields: {
  title: { type: "text", label: "Title", defaultValue: "Subscribe to our newsletter" },
  description: { type: "textarea", label: "Description" },  // was: subtitle
  placeholder: { type: "text", label: "Placeholder", defaultValue: "Enter your email" },
  buttonText: { type: "text", label: "Button Text", defaultValue: "Subscribe" },  // was: submitText
  successMessage: { type: "text", label: "Success Message", defaultValue: "Thanks for subscribing!" },
  variant: {  // was: layout
    type: "select", label: "Layout",
    options: [
      { label: "Inline", value: "inline" },
      { label: "Stacked", value: "stacked" },
      { label: "Card", value: "card" },       // NEW — was missing
    ],
    defaultValue: "inline",
  },

  // NEW — Appearance
  backgroundColor: { type: "color", label: "Background Color" },
  buttonColor: { type: "color", label: "Button Color" },
  textColor: { type: "color", label: "Text Color" },
  size: {
    type: "select", label: "Size",
    options: [
      { label: "Small", value: "sm" },
      { label: "Medium", value: "md" },
      { label: "Large", value: "lg" },
    ],
    defaultValue: "md",
  },
},
defaultProps: {
  title: "Subscribe to our newsletter",
  placeholder: "Enter your email",
  buttonText: "Subscribe",        // was: submitText
  successMessage: "Thanks for subscribing!",
  variant: "inline",              // was: layout
},
```

### 13.3 Form + FormField — Add to Converter

**Add to `typeMap` in converter.ts:**

```typescript
// Generic Form aliases
FormBlock: "Form",
FormSection: "Form",
FormContainer: "Form",
CustomForm: "Form",

// FormField aliases
FormFieldBlock: "FormField",
InputField: "FormField",
FormInput: "FormField",
```

**Add to `KNOWN_REGISTRY_TYPES` Set:**

```typescript
"Form",
"FormField",
```

### 13.4 Alignment Summary

| Component | Registry Changes | Converter Changes | Render Changes |
|-----------|-----------------|-------------------|---------------|
| **Form** | Add siteId, formId, enablePlatformSubmission fields | Add to typeMap + KNOWN_REGISTRY_TYPES | Add platform submission handler |
| **FormField** | Add aria props to AI hints | Add to typeMap + KNOWN_REGISTRY_TYPES | Add ARIA attributes |
| **ContactForm** | Add 16 missing fields (labels + styling) | Already complete | Fix emailTo → API fallback |
| **Newsletter** | Fix 3 name mismatches, add 4 styling fields, add "card" variant | Already complete (converter fixes names) | Rewrite submission to use /api/forms/submit |

---

## 14. Implementation Phases

### Phase 1: Critical Fixes — "Out of the Gate" (Priority: IMMEDIATE)

**Goal:** Every ContactForm and Newsletter on every published site submits successfully and delivers email notifications.

| Task | File | Lines | Change |
|------|------|-------|--------|
| 1.1 | `/api/forms/submit/route.ts` | sendNotifications function | Add 3-layer email fallback (form_settings → _emailTo → site owner) |
| 1.2 | `renders.tsx` | L17241-L17413 (NewsletterRender) | Rewrite: add `siteId` prop, `handleSubmit` with fetch to `/api/forms/submit`, honeypot, success/error states, display `successMessage` |
| 1.3 | `renders.tsx` | L17225 (NewsletterProps) | Add `siteId?: string` to interface |
| 1.4 | `core-components.ts` | L13376 (Newsletter) | Fix field name mismatches: `submitText` → `buttonText`, `layout` → `variant`, add `subtitle` alias or rename to `description`. Add `"card"` to variant options. |
| 1.5 | `core-components.ts` | L13419 (Newsletter defaultProps) | Fix key names to match render props |

**Verification:**
```
□ Deploy to staging
□ Create a test site with ContactForm → submit → check email delivery
□ Create a test site with Newsletter → submit → check form_submissions table
□ Check honeypot blocks bots on both components
□ Check success message displays correctly
□ Check dark mode rendering
```

### Phase 2: Registry Alignment — Full Configurability

**Goal:** Every render prop is configurable via the sidebar editor.

| Task | File | Lines | Change |
|------|------|-------|--------|
| 2.1 | `core-components.ts` | L13330 (ContactForm) | Add 16 missing fields (labels, styling, colours) |
| 2.2 | `core-components.ts` | L13376 (Newsletter) | Add `backgroundColor`, `buttonColor`, `textColor`, `size` fields |
| 2.3 | `core-components.ts` | L13330 (ContactForm ai) | Expand `canModify` to include styling props |
| 2.4 | `core-components.ts` | L13376 (Newsletter ai) | Expand `canModify` to include styling props |

### Phase 3: AI Converter Integration — Full Generation

**Goal:** AI Designer can generate Form + FormField compositions and custom forms.

| Task | File | Lines | Change |
|------|------|-------|--------|
| 3.1 | `converter.ts` | typeMap | Add Form and FormField aliases |
| 3.2 | `converter.ts` | KNOWN_REGISTRY_TYPES | Add `"Form"` and `"FormField"` |
| 3.3 | `renders.tsx` | L15892 (FormProps) | Add `siteId`, `formId`, `enablePlatformSubmission` props |
| 3.4 | `renders.tsx` | L15973 (FormRender) | Add platform submission handler (when enablePlatformSubmission=true) |
| 3.5 | `core-components.ts` | L12513 (Form) | Add `siteId`, `formId`, `enablePlatformSubmission` fields |

### Phase 4: Accessibility & Dark Mode Polish

**Goal:** All forms meet WCAG 2.1 AA and render correctly in dark mode.

| Task | File | Change |
|------|------|--------|
| 4.1 | `renders.tsx` (FormFieldRender) | Add `aria-required`, `aria-invalid`, `aria-describedby` to all inputs |
| 4.2 | `renders.tsx` (ContactFormRender) | Add error `role="alert"`, success `role="status" aria-live="polite"` |
| 4.3 | `renders.tsx` (NewsletterRender) | Add `<label>` with `sr-only` class for email input |
| 4.4 | `renders.tsx` (All form components) | Migrate Tailwind colour classes to inline styles with CSS variable fallbacks |

### Phase 5: Auto-Provisioning — form_settings Pipeline

**Goal:** When AI creates a site, form_settings are auto-created with site owner's email.

| Task | File | Change |
|------|------|--------|
| 5.1 | Site creation pipeline | After `sites` insert, create `form_settings` rows for contact-form and newsletter |
| 5.2 | Site creation pipeline | Pull creator's email from `users` table for `notify_emails` |
| 5.3 | Dashboard | Add form settings management UI (notify_emails, success_message, redirect_url) |

---

## 15. Testing & Quality Gates

### 15.1 Functional Tests

| Test | Description | Expected Result |
|------|-------------|-----------------|
| Contact form submit | Fill and submit ContactForm on published site | Submission stored in `form_submissions`, email sent to site owner |
| Newsletter submit | Fill and submit Newsletter on published site | Submission stored, email sent |
| Honeypot (contact) | Submit ContactForm with honeypot field filled | Fake success returned, no submission stored |
| Honeypot (newsletter) | Submit Newsletter with honeypot field filled | Fake success returned, no submission stored |
| Rate limit | Submit 11+ times from same IP in 1 hour | 429 response after limit exceeded |
| Spam detection | Submit with known spam patterns | Submission stored with `is_spam: true`, `status: "spam"` |
| No form_settings | Submit to site with no form_settings row | Submission stored, email sent to site owner (fallback) |
| emailTo override | Submit ContactForm with emailTo prop set | Email sent to emailTo address |
| Webhook delivery | Configure webhook, submit form | Webhook fires with correct payload |
| CSV export | Export submissions for a site | Valid CSV with all fields |

### 15.2 Visual Tests

| Test | Description | Expected Result |
|------|-------------|-----------------|
| ContactForm light mode | Render with default props | Clean form with proper spacing, labels, inputs |
| ContactForm dark mode | Render with dark backgroundColor | Text and inputs readable, borders visible |
| Newsletter inline | Render with variant="inline" | Email + button on same line |
| Newsletter stacked | Render with variant="stacked" | Email above button |
| Newsletter card | Render with variant="card" | Card container with background |
| FormField all types | Render each of 17 input types | Correct HTML element for each type |
| Success state | Submit form → success | Green success icon + successMessage visible |
| Error state | Submit form → API error | Red error icon + error message visible |
| Loading state | Click submit → loading | Button disabled, loading text/spinner visible |

### 15.3 Accessibility Tests

| Test | Tool | Expected Result |
|------|------|-----------------|
| Label association | axe-core | Every input has an associated label |
| Required announcement | Screen reader | `aria-required` announced on required fields |
| Error announcement | Screen reader | `role="alert"` announces error messages |
| Focus order | Tab key | Logical focus order through form fields |
| Submit keyboard | Enter key | Form submits on Enter from any text input |
| Honeypot invisible | Screen reader | `aria-hidden="true"` hides honeypot from AT |

### 15.4 Build Gate

```bash
# Must pass before any form changes are merged
pnpm tsc --noEmit                    # Zero new TS errors
# Manual verification:
# 1. Submit ContactForm on staging → email received
# 2. Submit Newsletter on staging → submission stored
# 3. Test dark mode on both components
# 4. Test honeypot on both components
```

---

## Appendix A: Complete Form Infrastructure Map

```
┌─────────────────────────────────────────────────────────────┐
│                    AI DESIGNER                               │
│  Generates component JSON with type + props                  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                  converter.ts                                │
│  typeMap resolves aliases → registered type names             │
│  ContactFormBlock → "ContactForm"                            │
│  NewsletterBlock → "Newsletter"                              │
│  Contact/Location/etc. → "ContactForm"                       │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase (site content JSONB)                    │
│  Component tree stored with type + props                     │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                  renderer.tsx                                 │
│  1. Look up render function from registry                    │
│  2. Inject siteId: { ...component.props, siteId }  (L218)   │
│  3. Call render function with injectedProps                   │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│             renders.tsx (Form Components)                     │
│                                                              │
│  FormRender (L15973)          FormFieldRender (L16426)       │
│  └── Generic container         └── 17 input types            │
│      action/method/onSubmit        label/validation/styling  │
│                                                              │
│  ContactFormRender (L16917)   NewsletterRender (L17241)      │
│  └── Built-in submission       └── Needs rewrite ⚠️          │
│      POST /api/forms/submit        Currently: action="#"     │
│      Honeypot + state machine      Target: /api/forms/submit │
└─────────────┬───────────────────────────────────────────────┘
              │ (on form submit)
              ▼
┌─────────────────────────────────────────────────────────────┐
│            POST /api/forms/submit                            │
│                                                              │
│  1. Validate { siteId, formId, data, honeypot }              │
│  2. Verify site exists                                       │
│  3. Query form_settings (or use defaults)                    │
│  4. Honeypot check → fake success if filled                  │
│  5. Rate limit check (memory + DB hybrid)                    │
│  6. Spam detection (keyword patterns)                        │
│  7. Store in form_submissions                                │
│  8. Send email via Resend (async)                            │
│  9. Fire webhooks (async)                                    │
│  10. Return { success, message, redirect, submissionId }     │
└─────────────┬───────────────────────┬───────────────────────┘
              │                       │
              ▼                       ▼
┌────────────────────┐  ┌────────────────────────┐
│  form_submissions  │  │  Email Notifications   │
│  (Supabase)        │  │  (Resend)              │
│                    │  │                        │
│  site_id           │  │  Fallback chain:       │
│  form_id           │  │  1. notify_emails      │
│  data (JSONB)      │  │  2. _emailTo           │
│  status            │  │  3. Site owner email   │
│  is_spam           │  │  4. Agency admin       │
│  metadata          │  │  5. Silent store       │
└────────────────────┘  └────────────────────────┘
```

---

## Appendix B: Database Schema Reference

### form_settings

```sql
CREATE TABLE form_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  form_id TEXT NOT NULL,
  form_name TEXT DEFAULT 'Contact Form',
  success_message TEXT DEFAULT 'Thank you for your submission!',
  redirect_url TEXT,
  notify_emails TEXT[] DEFAULT '{}',
  notify_on_submission BOOLEAN DEFAULT true,
  enable_honeypot BOOLEAN DEFAULT true,
  enable_rate_limit BOOLEAN DEFAULT true,
  rate_limit_per_hour INTEGER DEFAULT 10,
  retention_days INTEGER DEFAULT 365,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, form_id)
);
```

### form_submissions

```sql
CREATE TABLE form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  form_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  page_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived', 'spam')),
  is_spam BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  webhook_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### form_webhooks

```sql
CREATE TABLE form_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  form_id TEXT,  -- NULL = all forms for this site
  url TEXT NOT NULL,
  method TEXT DEFAULT 'POST' CHECK (method IN ('POST', 'PUT')),
  headers JSONB DEFAULT '{}',
  secret_key TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  last_status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Appendix C: CRM Module Forms (Parallel System)

The CRM module has its own form components that submit to a different endpoint:

| CRM Component | Endpoint | Storage |
|---------------|----------|---------|
| `CRMContactFormRender` | `/api/modules/crm/form-capture` | `mod_crmmod01_contacts` |
| `CRMLeadCaptureFormRender` | `/api/modules/crm/form-capture` | `mod_crmmod01_contacts` |
| `CRMNewsletterFormRender` | `/api/modules/crm/form-capture` | `mod_crmmod01_contacts` |

These are **separate from the core form system**. They create CRM contacts instead of form submissions. Sites with the CRM module installed can use these for lead management workflows. The core ContactForm and Newsletter should work independently of the CRM module.

**Future consideration:** Allow core forms to optionally create CRM contacts when the CRM module is installed — dual-write to both `form_submissions` and `mod_crmmod01_contacts`.

---

*Document version: 1.0*
*Created: March 2026*
*Verified against source: All line numbers grep-verified March 2026*
*Total form-related code: ~4,470 lines across 14 files*
