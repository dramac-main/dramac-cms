# PHASE-WL-01: White-Label Branding Foundation

**Priority**: 🔴 P0 (Critical — Revenue Blocker)  
**Estimated Effort**: 3-4 days  
**Dependencies**: None  
**Goal**: Build the branding infrastructure so every agency's customers see the agency brand, never "Dramac"

---

## Context

DRAMAC is a multi-tenant platform where agencies serve their own clients. Currently **every** customer-facing touchpoint says "Dramac" — emails, portal login, page titles, PDF documents, embed widgets. This is the #1 blocker for agencies taking the platform seriously.

### Current State (Scorecard)
| Area | Branding Score | Status |
|------|---------------|--------|
| Client Portal | 0% | Login, sidebar, header all say "DRAMAC" |
| Email System | 0% | All 18 email types send from "Dramac" with Dramac branding |
| Dashboard | 5% | Only agency name shows in sidebar, rest is "DRAMAC" |
| Published Sites | 60% | Sites can have custom domains but footer/SEO still leaks |
| Embeds/Widgets | 0% | Hardcoded "Powered by DRAMAC" |
| PDF/Documents | 0% | Quote/Invoice generation is a stub |

---

## Task 1: Branding Database Schema

**Problem**: No database table stores per-agency branding settings.  
**Solution**: Create a `agency_branding` table and related types.

### Migration

```sql
-- Migration: create_agency_branding_table
CREATE TABLE IF NOT EXISTS public.agency_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Core Identity
  agency_display_name TEXT NOT NULL,
  tagline TEXT,
  
  -- Logos (stored as Supabase Storage paths)
  logo_url TEXT,           -- Primary logo (light backgrounds)
  logo_dark_url TEXT,      -- Logo for dark mode
  favicon_url TEXT,        -- 32x32 favicon
  apple_touch_icon_url TEXT, -- 180x180 for iOS
  
  -- Colors (hex values)
  primary_color TEXT DEFAULT '#0F172A',
  primary_foreground TEXT DEFAULT '#FFFFFF',
  accent_color TEXT DEFAULT '#3B82F6',
  accent_foreground TEXT DEFAULT '#FFFFFF',
  
  -- Email Branding
  email_from_name TEXT,               -- "Acme Agency" instead of "Dramac"
  email_reply_to TEXT,                -- agency's own reply-to address
  email_footer_text TEXT,             -- Custom footer for emails
  email_footer_address TEXT,          -- Physical address (CAN-SPAM)
  email_logo_url TEXT,                -- Separate logo for emails (may differ)
  email_social_links JSONB DEFAULT '{}', -- { twitter: url, linkedin: url, ... }
  
  -- Portal Branding
  portal_welcome_title TEXT,          -- "Welcome to Acme Agency"
  portal_welcome_subtitle TEXT,       -- "Manage your websites and services"
  portal_login_background_url TEXT,   -- Custom login page background
  portal_custom_css TEXT,             -- Advanced: custom CSS overrides
  
  -- Legal / Footer
  support_email TEXT,
  support_url TEXT,
  privacy_policy_url TEXT,
  terms_of_service_url TEXT,
  
  -- White-Label Level
  white_label_level TEXT DEFAULT 'basic' CHECK (white_label_level IN ('basic', 'full', 'custom')),
  -- basic: agency name/logo replace Dramac
  -- full: all Dramac references removed, custom domain for portal
  -- custom: agency can inject custom CSS/HTML
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agency_id)
);

-- RLS Policies
ALTER TABLE public.agency_branding ENABLE ROW LEVEL SECURITY;

-- Agency members can read their agency's branding
CREATE POLICY "Agency members can read branding"
  ON public.agency_branding FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()
    )
  );

-- Agency owners/admins can update branding
CREATE POLICY "Agency admins can update branding"
  ON public.agency_branding FOR ALL
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Super admins can manage all branding
CREATE POLICY "Super admins full access to branding"
  ON public.agency_branding FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Portal clients can read branding for their agency
CREATE POLICY "Portal clients can read branding"
  ON public.agency_branding FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.portal_clients WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_agency_branding_updated_at
  BEFORE UPDATE ON public.agency_branding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### TypeScript Type

Create `src/types/branding.ts`:

```typescript
export interface AgencyBranding {
  id: string;
  agency_id: string;
  
  // Core Identity
  agency_display_name: string;
  tagline: string | null;
  
  // Logos
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  apple_touch_icon_url: string | null;
  
  // Colors
  primary_color: string;
  primary_foreground: string;
  accent_color: string;
  accent_foreground: string;
  
  // Email
  email_from_name: string | null;
  email_reply_to: string | null;
  email_footer_text: string | null;
  email_footer_address: string | null;
  email_logo_url: string | null;
  email_social_links: Record<string, string>;
  
  // Portal
  portal_welcome_title: string | null;
  portal_welcome_subtitle: string | null;
  portal_login_background_url: string | null;
  portal_custom_css: string | null;
  
  // Legal
  support_email: string | null;
  support_url: string | null;
  privacy_policy_url: string | null;
  terms_of_service_url: string | null;
  
  // Level
  white_label_level: 'basic' | 'full' | 'custom';
  
  created_at: string;
  updated_at: string;
}

// Default branding (fallback when agency hasn't configured)
export const DEFAULT_BRANDING: Partial<AgencyBranding> = {
  agency_display_name: 'Your Agency',
  primary_color: '#0F172A',
  primary_foreground: '#FFFFFF',
  accent_color: '#3B82F6',
  accent_foreground: '#FFFFFF',
  white_label_level: 'basic',
};
```

### Acceptance Criteria
- [ ] Migration runs successfully on Supabase
- [ ] RLS policies tested: agency members can read, admins can write, portal clients can read
- [ ] TypeScript types match database schema exactly
- [ ] Default branding falls back gracefully

---

## Task 2: BrandingProvider React Context

**Problem**: No React context to provide branding data throughout the app.  
**Solution**: Create a `BrandingProvider` that fetches and caches per-agency branding.

### Implementation

Create `src/components/providers/branding-provider.tsx`:

```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AgencyBranding, DEFAULT_BRANDING } from "@/types/branding";

interface BrandingContextType {
  branding: AgencyBranding | null;
  isLoading: boolean;
  error: Error | null;
  // Helpers
  getDisplayName: () => string;
  getLogoUrl: (mode?: 'light' | 'dark') => string | null;
  getEmailFromName: () => string;
  getPrimaryColor: () => string;
  getAccentColor: () => string;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ 
  agencyId, 
  children,
  initialBranding // Server-side fetched for SSR
}: { 
  agencyId: string; 
  children: React.ReactNode;
  initialBranding?: AgencyBranding | null;
}) {
  const [branding, setBranding] = useState<AgencyBranding | null>(initialBranding ?? null);
  const [isLoading, setIsLoading] = useState(!initialBranding);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initialBranding) return; // Already have SSR data
    
    async function fetchBranding() {
      try {
        const response = await fetch(`/api/branding/${agencyId}`);
        if (response.ok) {
          const data = await response.json();
          setBranding(data);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBranding();
  }, [agencyId, initialBranding]);

  const value: BrandingContextType = {
    branding,
    isLoading,
    error,
    getDisplayName: () => branding?.agency_display_name ?? DEFAULT_BRANDING.agency_display_name!,
    getLogoUrl: (mode = 'light') => 
      mode === 'dark' ? (branding?.logo_dark_url ?? branding?.logo_url ?? null) : (branding?.logo_url ?? null),
    getEmailFromName: () => branding?.email_from_name ?? branding?.agency_display_name ?? 'Dramac',
    getPrimaryColor: () => branding?.primary_color ?? DEFAULT_BRANDING.primary_color!,
    getAccentColor: () => branding?.accent_color ?? DEFAULT_BRANDING.accent_color!,
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
```

### API Route

Create `src/app/api/branding/[agencyId]/route.ts`:
- `GET`: Fetch branding for an agency (check permissions via session)
- `PUT`: Update branding (admin/owner only)
- Cache response with `Cache-Control: public, max-age=300, stale-while-revalidate=600`

### Integration

Mount `BrandingProvider` in the dashboard layout:
1. In `src/app/(dashboard)/layout.tsx`: Wrap children with `<BrandingProvider agencyId={session.agencyId}>`
2. In `src/app/(portal)/layout.tsx`: Wrap with `<BrandingProvider agencyId={portalAgencyId}>`
3. Pass server-fetched `initialBranding` for instant render (no loading flash)

### Acceptance Criteria
- [ ] `useBranding()` hook works in any dashboard/portal component
- [ ] Branding data is fetched once and cached
- [ ] SSR initial data works (no flash of default branding)
- [ ] Helper functions return sensible defaults when branding is not configured

---

## Task 3: Remove ALL Hardcoded "DRAMAC" References

**Problem**: Platform name is hardcoded in 50+ locations across the codebase.  
**Solution**: Replace every hardcoded reference with dynamic branding or a configurable constant.

### Find & Replace Audit

Search the entire codebase for these patterns:
- `"Dramac"` / `"DRAMAC"` / `"dramac"` (string literals)
- `Dramac` in JSX text content
- `dramacagency.com` in email addresses
- `"Powered by DRAMAC"` in embed/widget code
- `"| DRAMAC"` in page titles

### Categories of Replacement

**A. Dashboard Internal (replace with platform config)**
Files in `src/` that show "DRAMAC" to agency members:
- Page titles: `<title>Page Name | DRAMAC</title>` → `<title>Page Name | {agencyName}</title>`
- Sidebar logo text → Use `useBranding().getDisplayName()`
- Footer copyright → Dynamic

**B. Client-Facing (replace with agency branding)**
Files that clients/customers see:
- Portal login page → `useBranding().getDisplayName()` + agency logo
- Portal sidebar header → Agency logo + name
- Email templates → `branding.email_from_name` (see Phase WL-02)
- Published site footers → Agency or site branding
- Embed widgets → `Powered by {agencyName}` or hide completely on `full` white-label

**C. Platform Infrastructure (keep as "Dramac" but make configurable)**
- `src/lib/email/resend-client.ts` `getEmailFrom()` → Accept agency branding parameter
- `src/lib/constants.ts` or equivalent — Create `PLATFORM_NAME = "Dramac"` constant
- Only Super Admin UI should show "Dramac" platform name

### Implementation

1. Create `src/lib/constants/platform.ts`:
```typescript
export const PLATFORM = {
  name: "Dramac",
  domain: "dramacagency.com",
  support_email: "support@dramacagency.com",
  legal_name: "Dramac Agency Ltd",
} as const;
```

2. Create a `useDynamicTitle()` hook:
```typescript
// Sets document.title based on branding context
export function useDynamicTitle(pageTitle: string) {
  const { getDisplayName } = useBranding();
  useEffect(() => {
    document.title = `${pageTitle} | ${getDisplayName()}`;
  }, [pageTitle, getDisplayName]);
}
```

3. Systematically replace every hardcoded reference (see checklist below)

### File-by-File Checklist

| File | What to Replace | Replace With |
|------|----------------|-------------|
| `src/components/layout/sidebar.tsx` | Logo text "DRAMAC" | `useBranding().getLogoUrl()` or `getDisplayName()` |
| `src/components/layout/mobile-nav.tsx` | "DRAMAC" text | Same as sidebar |
| `src/app/(auth)/login/page.tsx` | "Welcome to Dramac" | `useBranding().getDisplayName()` |
| `src/app/(auth)/register/page.tsx` | "Create your Dramac account" | Dynamic |
| `src/app/(portal)/login/page.tsx` | Portal login branding | Full agency branding |
| All `metadata` exports | `title: "... \| DRAMAC"` | Use `generateMetadata()` with branding |
| `src/lib/email/templates.ts` | ALL "Dramac" text (6+ locations) | `branding.agency_display_name` |
| `src/lib/email/resend-client.ts` | `getEmailFrom()` | Accept `fromName` parameter |
| Embed widget components | "Powered by DRAMAC" | Dynamic or hidden |
| PDF generation stubs | Any "Dramac" in templates | Agency branding |

### Acceptance Criteria
- [ ] `grep -r "Dramac" src/ --include="*.tsx" --include="*.ts"` returns ZERO hardcoded client-facing references
- [ ] All client-facing text uses `useBranding()` or equivalent
- [ ] Dashboard shows agency name, not "Dramac"
- [ ] Portal shows agency branding on login, sidebar, header
- [ ] Platform name only appears in Super Admin UI and internal configs

---

## Task 4: Branding Settings Page

**Problem**: Agency settings has basic name/description but NO branding configuration UI.  
**Solution**: Build a comprehensive branding settings page.

### Implementation

Create `src/app/(dashboard)/dashboard/settings/branding/page.tsx`:

**Section 1: Identity**
- Agency display name (text input)
- Tagline (text input)
- Primary logo upload (with preview, light mode)
- Dark mode logo upload (with preview)
- Favicon upload (with 32x32 preview)

**Section 2: Colors**
- Primary color picker (with hex input)
- Primary foreground color
- Accent color picker
- Accent foreground color
- **Live preview panel** — shows how colors look on a mock sidebar/button

**Section 3: Email Branding**
- Email "From" name
- Reply-to email address
- Email logo (may differ from main logo)
- Email footer text
- Physical address (required by CAN-SPAM)
- Social media links (Twitter, LinkedIn, Facebook, Instagram)
- **Preview button** — sends a test email to the admin

**Section 4: Portal Branding**
- Portal welcome title
- Portal welcome subtitle
- Login page background image upload
- Portal custom CSS (code editor, advanced users only)

**Section 5: Legal**
- Support email
- Support URL
- Privacy policy URL
- Terms of service URL

**Section 6: White-Label Level** (if applicable to plan)
- Basic / Full / Custom toggle with explanations
- Preview of what each level hides/shows

### Form Behavior
- Auto-save with debounce (500ms) OR explicit "Save" button
- Validation: hex colors, valid URLs, email format
- Image upload via Supabase Storage with preview
- Changes take effect immediately after save (clear branding cache)

### Acceptance Criteria
- [ ] All branding fields are editable
- [ ] Image uploads work with preview
- [ ] Color pickers show live preview
- [ ] Email preview sends a test email with current branding
- [ ] Form validates all fields appropriately
- [ ] Settings save to `agency_branding` table

---

## Task 5: Apply Branding to Dashboard Chrome

**Problem**: Dashboard sidebar, header, and mobile nav show generic "DRAMAC".  
**Solution**: Inject agency branding into all dashboard chrome.

### Implementation

1. **Sidebar Logo**:
   - If `branding.logo_url` exists → Show logo image
   - If only `agency_display_name` → Show styled text
   - Use `logo_dark_url` in dark mode (fall back to `logo_url` with CSS filter)

2. **Dashboard Title Bar**:
   - Page titles: `useDynamicTitle("Sites")` → "Sites | Acme Agency"
   - Replace any "DRAMAC" in header/breadcrumbs

3. **Favicon**:
   - If `branding.favicon_url` exists → Dynamically set `<link rel="icon">`
   - Use `useBranding()` + `useEffect` to swap favicon

4. **Color Theme**:
   - Inject CSS custom properties from branding:
   ```css
   :root {
     --brand-primary: var(--branding-primary, #0F172A);
     --brand-accent: var(--branding-accent, #3B82F6);
   }
   ```
   - Apply via a `<style>` tag in BrandingProvider

5. **Mobile Bottom Nav**:
   - Same branding treatment as sidebar

### Acceptance Criteria
- [ ] Sidebar shows agency logo (or styled name if no logo)
- [ ] Page titles show agency name
- [ ] Favicon matches agency's uploaded favicon
- [ ] Brand colors applied to primary interactive elements
- [ ] Mobile navigation matches desktop branding

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `migrations/XXXX_create_agency_branding.sql` | Database schema |
| CREATE | `src/types/branding.ts` | TypeScript types |
| CREATE | `src/components/providers/branding-provider.tsx` | React context |
| CREATE | `src/app/api/branding/[agencyId]/route.ts` | API endpoint |
| CREATE | `src/lib/constants/platform.ts` | Platform constants |
| CREATE | `src/hooks/use-dynamic-title.ts` | Dynamic page titles |
| CREATE | `src/app/(dashboard)/dashboard/settings/branding/page.tsx` | Settings UI |
| MODIFY | `src/app/(dashboard)/layout.tsx` | Mount BrandingProvider |
| MODIFY | `src/app/(portal)/layout.tsx` | Mount BrandingProvider |
| MODIFY | `src/components/layout/sidebar.tsx` | Agency logo/name |
| MODIFY | `src/components/layout/mobile-nav.tsx` | Agency branding |
| MODIFY | `src/app/(auth)/login/page.tsx` | Remove hardcoded "Dramac" |
| MODIFY | `src/app/(auth)/register/page.tsx` | Remove hardcoded "Dramac" |
| MODIFY | All `metadata` exports | Dynamic titles |
| MODIFY | 50+ files | Remove "DRAMAC" hardcodes |

---

## Testing Checklist

- [ ] Create agency branding with logo, colors, email settings
- [ ] Dashboard sidebar shows agency logo and name
- [ ] Page titles show agency name (check `document.title`)
- [ ] Login to portal as client — see agency branding, NOT "Dramac"
- [ ] Favicon changes to agency's uploaded icon
- [ ] Colors apply: sidebar accent, buttons, links use brand colors
- [ ] Mobile dashboard shows agency branding
- [ ] `grep -ri "dramac" src/ --include="*.tsx"` returns only infrastructure/constant references
- [ ] Agency without branding configured → graceful defaults (agency name, default colors)
- [ ] Super Admin dashboard still shows "Dramac" platform branding
