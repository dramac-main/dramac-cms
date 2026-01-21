# Phase 2: Supabase Schema & Setup

> **AI Model**: Claude Opus 4.5 (3x) - Database architecture requires careful planning
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` before starting

---

## 🎯 Objective

Set up Supabase project with complete database schema, row-level security (RLS) policies, and TypeScript client configuration.

---

## 📋 Prerequisites

- [ ] Phase 1 completed
- [ ] Supabase account created (https://supabase.com)
- [ ] New Supabase project created

---

## ✅ Tasks

### Task 2.1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: `dramac-v2`
4. Database password: (save securely)
5. Region: Choose closest to your users
6. Wait for project to provision

### Task 2.2: Get API Keys

From Supabase Dashboard → Settings → API:
- Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

Update `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

### Task 2.3: Create Database Schema

Go to Supabase Dashboard → SQL Editor → New Query.

Run the following SQL:

```sql
-- =============================================
-- DRAMAC V2 DATABASE SCHEMA
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Agencys (Agencies - your direct customers)
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Plan determines per-seat pricing
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  
  -- Stripe billing
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  billing_email TEXT,
  
  -- White-label (Pro/Enterprise only)
  white_label_enabled BOOLEAN DEFAULT FALSE,
  custom_branding JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'admin', 'member')),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency Members (team members)
CREATE TABLE public.agency_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  permissions JSONB DEFAULT '{}',
  
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  
  UNIQUE(agency_id, user_id)
);

-- Clients (Agency's customers - BILLABLE SEATS)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  
  -- Client info
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  phone TEXT,
  
  -- Seat status (determines billing)
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  
  -- Billing tracking
  seat_activated_at TIMESTAMPTZ DEFAULT NOW(),
  seat_paused_at TIMESTAMPTZ,
  stripe_subscription_item_id TEXT,
  
  -- Client portal access (optional feature)
  has_portal_access BOOLEAN DEFAULT FALSE,
  portal_user_id UUID REFERENCES auth.users(id),
  
  -- Notes & organization
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites (websites created for clients)
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  
  -- Site info
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  
  -- Status
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- Settings (favicon, fonts, colors, etc.)
  settings JSONB DEFAULT '{
    "favicon": null,
    "fonts": {
      "heading": "Inter",
      "body": "Inter"
    },
    "colors": {
      "primary": "#6366f1",
      "secondary": "#8b5cf6",
      "accent": "#ec4899"
    }
  }',
  
  -- SEO defaults
  seo_title TEXT,
  seo_description TEXT,
  seo_image TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pages (individual pages within a site)
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  
  -- Page info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_homepage BOOLEAN DEFAULT FALSE,
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  seo_image TEXT,
  
  -- Ordering
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, slug)
);

-- Page Content (Craft.js serialized state)
CREATE TABLE public.page_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Craft.js JSON content
  content JSONB NOT NULL DEFAULT '{}',
  
  -- Version tracking
  version INT DEFAULT 1,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets (uploaded images, files)
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  
  -- File info
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- Metadata
  mime_type TEXT NOT NULL,
  size INT NOT NULL, -- bytes
  width INT, -- for images
  height INT, -- for images
  
  -- Agency
  folder TEXT DEFAULT 'uploads',
  alt_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MODULE SYSTEM TABLES (Defined in Phase 29)
-- =============================================
-- NOTE: The complete module system (modules, module_subscriptions, site_modules, module_usage)
-- is defined in PHASE-29-MODULE-FOUNDATION.md. Do NOT create these tables here.
-- This ensures the latest schema with all features is used.

-- =============================================
-- BILLING TABLES (Defined in Phase 33)
-- =============================================
-- NOTE: The complete billing system (billing_customers, billing_subscriptions, billing_invoices)
-- is defined in PHASE-33-BILLING-FOUNDATION.md. Do NOT create these tables here.
-- This ensures the latest Stripe integration schema is used.

-- =============================================
-- INDEXES (for Core Tables only - Module/Billing indexes in their phases)
-- =============================================

CREATE INDEX idx_agencies_owner ON public.agencies(owner_id);
CREATE INDEX idx_agencies_slug ON public.agencies(slug);

CREATE INDEX idx_profiles_agency ON public.profiles(agency_id);

CREATE INDEX idx_agency_members_org ON public.agency_members(agency_id);
CREATE INDEX idx_agency_members_user ON public.agency_members(user_id);

CREATE INDEX idx_clients_org ON public.clients(agency_id);
CREATE INDEX idx_clients_status ON public.clients(status);

CREATE INDEX idx_sites_client ON public.sites(client_id);
CREATE INDEX idx_sites_org ON public.sites(agency_id);
CREATE INDEX idx_sites_subdomain ON public.sites(subdomain);
CREATE INDEX idx_sites_custom_domain ON public.sites(custom_domain);

CREATE INDEX idx_pages_site ON public.pages(site_id);

CREATE INDEX idx_assets_site ON public.assets(site_id);
CREATE INDEX idx_assets_org ON public.assets(agency_id);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_page_content_updated_at BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- NOTE: Triggers for modules, module_subscriptions, billing_* tables are defined
-- in their respective phases (Phase 29 and Phase 33)
```

### Task 2.4: Create Row-Level Security Policies

Run this SQL after the schema:

```sql
-- =============================================
-- ROW LEVEL SECURITY POLICIES (Core Tables)
-- =============================================
-- NOTE: RLS for modules and billing tables is defined in Phase 29 and Phase 33

-- Enable RLS on core tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id = org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin or owner of organization
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's organization ID
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT agency_id INTO org_id
  FROM public.agency_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ORGANIZATIONS POLICIES
-- =============================================

-- Users can view agencies they are members of
CREATE POLICY "Users can view own agencies"
  ON public.agencies FOR SELECT
  USING (is_org_member(id));

-- Only owners can update organization
CREATE POLICY "Owners can update organization"
  ON public.agencies FOR UPDATE
  USING (owner_id = auth.uid());

-- Users can create agencies (will become owner)
CREATE POLICY "Users can create agencies"
  ON public.agencies FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Users can insert own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- =============================================
-- ORGANIZATION MEMBERS POLICIES
-- =============================================

-- Members can view other members in their org
CREATE POLICY "Members can view org members"
  ON public.agency_members FOR SELECT
  USING (is_org_member(agency_id));

-- Admins can add members
CREATE POLICY "Admins can add members"
  ON public.agency_members FOR INSERT
  WITH CHECK (is_org_admin(agency_id));

-- Admins can update members (except owner)
CREATE POLICY "Admins can update members"
  ON public.agency_members FOR UPDATE
  USING (is_org_admin(agency_id) AND role != 'owner');

-- Admins can remove members (except owner)
CREATE POLICY "Admins can remove members"
  ON public.agency_members FOR DELETE
  USING (is_org_admin(agency_id) AND role != 'owner');

-- =============================================
-- CLIENTS POLICIES
-- =============================================

-- Members can view clients in their org
CREATE POLICY "Members can view clients"
  ON public.clients FOR SELECT
  USING (is_org_member(agency_id));

-- Members can create clients
CREATE POLICY "Members can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (is_org_member(agency_id));

-- Members can update clients
CREATE POLICY "Members can update clients"
  ON public.clients FOR UPDATE
  USING (is_org_member(agency_id));

-- Admins can delete clients
CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE
  USING (is_org_admin(agency_id));

-- =============================================
-- SITES POLICIES
-- =============================================

-- Members can view sites in their org
CREATE POLICY "Members can view sites"
  ON public.sites FOR SELECT
  USING (is_org_member(agency_id));

-- Members can create sites
CREATE POLICY "Members can create sites"
  ON public.sites FOR INSERT
  WITH CHECK (is_org_member(agency_id));

-- Members can update sites
CREATE POLICY "Members can update sites"
  ON public.sites FOR UPDATE
  USING (is_org_member(agency_id));

-- Admins can delete sites
CREATE POLICY "Admins can delete sites"
  ON public.sites FOR DELETE
  USING (is_org_admin(agency_id));

-- Public can view published sites (for renderer)
CREATE POLICY "Public can view published sites"
  ON public.sites FOR SELECT
  USING (published = true);

-- =============================================
-- PAGES POLICIES
-- =============================================

-- Members can manage pages through site membership
CREATE POLICY "Members can view pages"
  ON public.pages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = pages.site_id
    AND is_org_member(sites.agency_id)
  ));

CREATE POLICY "Members can create pages"
  ON public.pages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = site_id
    AND is_org_member(sites.agency_id)
  ));

CREATE POLICY "Members can update pages"
  ON public.pages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = pages.site_id
    AND is_org_member(sites.agency_id)
  ));

CREATE POLICY "Members can delete pages"
  ON public.pages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = pages.site_id
    AND is_org_member(sites.agency_id)
  ));

-- Public can view pages of published sites
CREATE POLICY "Public can view published pages"
  ON public.pages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = pages.site_id
    AND sites.published = true
  ));

-- =============================================
-- PAGE CONTENT POLICIES
-- =============================================

CREATE POLICY "Members can view page content"
  ON public.page_content FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.pages
    JOIN public.sites ON sites.id = pages.site_id
    WHERE pages.id = page_content.page_id
    AND is_org_member(sites.agency_id)
  ));

CREATE POLICY "Members can manage page content"
  ON public.page_content FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.pages
    JOIN public.sites ON sites.id = pages.site_id
    WHERE pages.id = page_content.page_id
    AND is_org_member(sites.agency_id)
  ));

-- Public can view content of published pages
CREATE POLICY "Public can view published content"
  ON public.page_content FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.pages
    JOIN public.sites ON sites.id = pages.site_id
    WHERE pages.id = page_content.page_id
    AND sites.published = true
  ));

-- NOTE: Modules RLS policies are defined in Phase 29 (Module Foundation)
-- Do NOT create modules policies here.

-- =============================================
-- ASSETS POLICIES
-- =============================================

CREATE POLICY "Members can manage assets"
  ON public.assets FOR ALL
  USING (is_org_member(agency_id));

-- Public can view assets of published sites
CREATE POLICY "Public can view published assets"
  ON public.assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.sites
    WHERE sites.id = assets.site_id
    AND sites.published = true
  ));

-- =============================================
-- MODULE & BILLING POLICIES (Defined in Phase 29 & 33)
-- =============================================
-- NOTE: RLS policies for modules, module_subscriptions, site_modules,
-- billing_customers, billing_subscriptions, and billing_invoices
-- are defined in their respective phases (Phase 29 and Phase 33).
-- Do NOT duplicate them here.
```

### Task 2.5: Create Supabase Client Files

**File: `src/lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**File: `src/lib/supabase/server.ts`**

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
```

**File: `src/lib/supabase/middleware.ts`**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return supabaseResponse;
}
```

**File: `src/middleware.ts`**

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * - sites/* (public site renderer)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|sites).*)",
  ],
};
```

### Task 2.6: Create Storage Bucket

In Supabase Dashboard → Storage:

1. Create bucket named `assets`
2. Set to **Public** bucket
3. Add policy for authenticated uploads:

```sql
-- Storage policies
CREATE POLICY "Users can upload to own org folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

CREATE POLICY "Users can delete own org assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assets' AND
  auth.uid() IS NOT NULL
);
```

### Task 2.7: Seed Initial Data (Optional)

```sql
-- Insert some sample modules for marketplace
INSERT INTO public.modules (slug, name, description, icon, category, price_monthly, is_free, is_public, component_path) VALUES
('seo-optimizer', 'SEO Optimizer', 'Analyze and improve your site''s search engine ranking', 'search', 'marketing', 9.99, false, true, 'modules/seo-optimizer'),
('blog-writer', 'AI Blog Writer', 'Generate blog posts with AI assistance', 'edit', 'productivity', 14.99, false, true, 'modules/blog-writer'),
('instagram-feed', 'Instagram Feed', 'Display your Instagram feed on your site', 'instagram', 'social', 7.99, false, true, 'modules/instagram-feed'),
('contact-forms', 'Contact Forms', 'Advanced contact forms with submissions management', 'mail', 'communication', 0, true, true, 'modules/contact-forms'),
('analytics', 'Analytics Dashboard', 'Track visitor analytics and site performance', 'bar-chart', 'analytics', 12.99, false, true, 'modules/analytics'),
('live-chat', 'Live Chat Widget', 'Chat with your site visitors in real-time', 'message-circle', 'communication', 19.99, false, true, 'modules/live-chat');
```

---

## 📐 Acceptance Criteria

- [ ] Supabase project created and running
- [ ] All tables created successfully
- [ ] RLS enabled on all tables
- [ ] RLS policies working correctly
- [ ] Storage bucket created
- [ ] Environment variables set in `.env.local`
- [ ] Supabase client files created
- [ ] Middleware configured
- [ ] TypeScript types match database schema

---

## 🧪 Verification

1. Go to Supabase Dashboard → Table Editor
2. Verify all tables exist with correct columns
3. Go to Authentication → Policies
4. Verify RLS is enabled on all tables
5. Test the client connection:

```typescript
// In any server component, test:
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase.from("modules").select("*");
console.log(data); // Should show seeded modules
```

---

## 📁 Files Created This Phase

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── middleware.ts
├── middleware.ts
.env.local (updated)
```

---

## ➡️ Next Phase

**Phase 3: Design System & Tokens** - Create the global CSS variables and Tailwind configuration.





