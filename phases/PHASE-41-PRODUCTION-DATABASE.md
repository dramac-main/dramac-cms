# Phase 41: Production - Database Migration

> **AI Model**: Claude Opus 4.5 (3x) ⭐ CRITICAL PHASE
>
> **⚠️ FIRST**: Read `PHASE-00-MASTER-REFERENCE.md` and all previous phases

---

## 🎯 Objective

Finalize database schema, create production-ready migrations, add indexes, and set up database maintenance.

---

## 📋 Prerequisites

- [ ] All previous phases completed
- [ ] Supabase project created
- [ ] All tables tested in development

---

## ✅ Tasks

### Task 41.1: Complete Migration Script

> **⚠️ IMPORTANT**: This migration is a COMPLETE schema file for fresh production deployments. 
> If you ran phases incrementally during development, use `migrations/reset_schema.sql` to drop 
> all existing tables first, OR use this only for new/clean Supabase projects.

**File: `migrations/001_complete_schema.sql`**

```sql
-- DRAMAC Platform - Complete Database Schema
-- Version 1.0.0
-- Run this in Supabase SQL Editor for FRESH DEPLOYMENTS ONLY
-- For existing databases, see migrations/incremental/ folder

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Agencies (Customers/Tenants)
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  needs_subscription BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency members (junction table)
CREATE TABLE IF NOT EXISTS public.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);

-- Clients (Agency's clients)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sites
CREATE TABLE IF NOT EXISTS public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  domain TEXT UNIQUE,
  domain_verified BOOLEAN DEFAULT false,
  domain_verified_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, slug)
);

-- Pages
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  og_image TEXT,
  is_homepage BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, slug)
);

-- ============================================
-- BILLING TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  quantity INTEGER NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount_due INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  invoice_pdf TEXT,
  hosted_invoice_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODULE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT,
  price_monthly DECIMAL(10, 2) DEFAULT 0,
  price_yearly DECIMAL(10, 2),
  stripe_product_id TEXT,
  stripe_price_monthly TEXT,
  stripe_price_yearly TEXT,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.module_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, module_id)
);

CREATE TABLE IF NOT EXISTS public.site_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, module_id)
);

-- ============================================
-- ACTIVITY LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Agencies
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON public.agencies(slug);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Agency Members
CREATE INDEX IF NOT EXISTS idx_agency_members_user ON public.agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON public.agency_members(agency_id);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_agency ON public.clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(agency_id, status);

-- Sites
CREATE INDEX IF NOT EXISTS idx_sites_client ON public.sites(client_id);
CREATE INDEX IF NOT EXISTS idx_sites_domain ON public.sites(domain);
CREATE INDEX IF NOT EXISTS idx_sites_slug ON public.sites(slug);
CREATE INDEX IF NOT EXISTS idx_sites_published ON public.sites(published) WHERE published = true;

-- Pages
CREATE INDEX IF NOT EXISTS idx_pages_site ON public.pages(site_id);
CREATE INDEX IF NOT EXISTS idx_pages_published ON public.pages(site_id, published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_pages_homepage ON public.pages(site_id, is_homepage) WHERE is_homepage = true;

-- Billing
CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe ON public.billing_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_subs_agency ON public.billing_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_agency ON public.billing_invoices(agency_id);

-- Modules
CREATE INDEX IF NOT EXISTS idx_modules_category ON public.modules(category);
CREATE INDEX IF NOT EXISTS idx_module_subs_agency ON public.module_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_site_modules_site ON public.site_modules(site_id);

-- Activity
CREATE INDEX IF NOT EXISTS idx_activity_agency ON public.activity_logs(agency_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (see next task)
```

### Task 41.2: RLS Policies

**File: `migrations/002_rls_policies.sql`**

```sql
-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles: Users can view/edit own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Agencies: Members can view their agencies
CREATE POLICY "Members can view agencies"
  ON public.agencies FOR SELECT
  USING (
    id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners can update agencies"
  ON public.agencies FOR UPDATE
  USING (
    id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Agency Members: Members can view other members
CREATE POLICY "Members can view agency members"
  ON public.agency_members FOR SELECT
  USING (
    agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners can manage agency members"
  ON public.agency_members FOR ALL
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Clients: Agency members can view/manage
CREATE POLICY "Agency members can view clients"
  ON public.clients FOR SELECT
  USING (
    agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Agency members can manage clients"
  ON public.clients FOR ALL
  USING (
    agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid())
  );

-- Sites: Agency members can view/manage via clients
CREATE POLICY "Agency members can view sites"
  ON public.sites FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      JOIN public.agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "Agency members can manage sites"
  ON public.sites FOR ALL
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      JOIN public.agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Pages: Via sites
CREATE POLICY "Agency members can view pages"
  ON public.pages FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      JOIN public.agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "Agency members can manage pages"
  ON public.pages FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      JOIN public.agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Billing: Owners only
CREATE POLICY "Owners can view billing customers"
  ON public.billing_customers FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can view subscriptions"
  ON public.billing_subscriptions FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can view invoices"
  ON public.billing_invoices FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Modules: Public read
CREATE POLICY "Anyone can view active modules"
  ON public.modules FOR SELECT
  USING (is_active = true);

-- Module subscriptions
CREATE POLICY "Members can view module subscriptions"
  ON public.module_subscriptions FOR SELECT
  USING (
    agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid())
  );

-- Site modules
CREATE POLICY "Members can view site modules"
  ON public.site_modules FOR SELECT
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      JOIN public.agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can manage site modules"
  ON public.site_modules FOR ALL
  USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      JOIN public.agency_members am ON c.agency_id = am.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Activity logs
CREATE POLICY "Members can view agency activity"
  ON public.activity_logs FOR SELECT
  USING (
    agency_id IN (SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid())
  );
```

### Task 41.3: Database Functions

**File: `migrations/003_functions.sql`**

```sql
-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_billing_subscriptions_updated_at
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure single homepage per site
CREATE OR REPLACE FUNCTION ensure_single_homepage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_homepage = true THEN
    UPDATE public.pages
    SET is_homepage = false
    WHERE site_id = NEW.site_id AND id != NEW.id AND is_homepage = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_homepage_trigger
  BEFORE INSERT OR UPDATE ON public.pages
  FOR EACH ROW
  WHEN (NEW.is_homepage = true)
  EXECUTE FUNCTION ensure_single_homepage();

-- Count clients for agency
CREATE OR REPLACE FUNCTION get_agency_client_count(p_agency_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM public.clients
    WHERE agency_id = p_agency_id AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Task 41.4: Seed Data

**File: `migrations/004_seed_data.sql`**

```sql
-- ============================================
-- SEED DATA - MODULES
-- ============================================

INSERT INTO public.modules (name, slug, description, category, icon, price_monthly, price_yearly, features) VALUES
  ('Advanced Analytics', 'analytics', 'Track visitor behavior, page views, and conversions', 'analytics', '📊', 15, 150, '["Real-time dashboard", "Visitor tracking", "Conversion goals", "Export reports"]'),
  ('SEO Tools', 'seo', 'Optimize your sites for search engines', 'marketing', '🔍', 10, 100, '["Meta tag editor", "Sitemap generation", "Schema markup", "SEO audit"]'),
  ('Contact Forms', 'forms', 'Create and manage contact forms', 'forms', '📝', 5, 50, '["Drag-drop builder", "Email notifications", "Spam protection", "Form analytics"]'),
  ('Blog Engine', 'blog', 'Add a blog to any site', 'content', '📰', 15, 150, '["Rich text editor", "Categories & tags", "Comments", "RSS feed"]'),
  ('E-commerce', 'ecommerce', 'Sell products online', 'commerce', '🛒', 25, 250, '["Product catalog", "Shopping cart", "Stripe payments", "Order management"]'),
  ('Multilingual', 'multilingual', 'Translate sites into multiple languages', 'content', '🌐', 10, 100, '["Auto-translation", "Language switcher", "RTL support", "SEO per language"]'),
  ('A/B Testing', 'ab-testing', 'Test variations to improve conversions', 'analytics', '🧪', 20, 200, '["Visual editor", "Traffic splitting", "Statistical analysis", "Winner selection"]'),
  ('Popup Builder', 'popups', 'Create engaging popups and modals', 'marketing', '💬', 10, 100, '["Exit intent", "Timed popups", "Targeting rules", "A/B testing"]')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features;
```

### Task 41.5: Database Types Generation

**File: `src/types/database.ts`**

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          settings: Json;
          needs_subscription: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          settings?: Json;
          needs_subscription?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          settings?: Json;
          needs_subscription?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      agency_members: {
        Row: {
          id: string;
          agency_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          invited_at: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          invited_at?: string;
          joined_at?: string;
        };
        Update: {
          role?: "owner" | "admin" | "member";
        };
      };
      clients: {
        Row: {
          id: string;
          agency_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          avatar_url: string | null;
          notes: string | null;
          status: "active" | "inactive" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agency_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          avatar_url?: string | null;
          notes?: string | null;
          status?: "active" | "inactive" | "archived";
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          avatar_url?: string | null;
          notes?: string | null;
          status?: "active" | "inactive" | "archived";
        };
      };
      sites: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          slug: string;
          domain: string | null;
          domain_verified: boolean;
          domain_verified_at: string | null;
          settings: Json;
          published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          slug: string;
          domain?: string | null;
          settings?: Json;
          published?: boolean;
        };
        Update: {
          name?: string;
          slug?: string;
          domain?: string | null;
          domain_verified?: boolean;
          domain_verified_at?: string | null;
          settings?: Json;
          published?: boolean;
          published_at?: string | null;
        };
      };
      pages: {
        Row: {
          id: string;
          site_id: string;
          title: string;
          slug: string;
          content: Json;
          seo_title: string | null;
          seo_description: string | null;
          og_image: string | null;
          is_homepage: boolean;
          published: boolean;
          published_at: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          title: string;
          slug: string;
          content?: Json;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image?: string | null;
          is_homepage?: boolean;
          published?: boolean;
          sort_order?: number;
        };
        Update: {
          title?: string;
          slug?: string;
          content?: Json;
          seo_title?: string | null;
          seo_description?: string | null;
          og_image?: string | null;
          is_homepage?: boolean;
          published?: boolean;
          published_at?: string | null;
          sort_order?: number;
        };
      };
      modules: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category: string;
          icon: string | null;
          price_monthly: number;
          price_yearly: number | null;
          stripe_product_id: string | null;
          stripe_price_monthly: string | null;
          stripe_price_yearly: string | null;
          features: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          description?: string | null;
          category: string;
          icon?: string | null;
          price_monthly?: number;
          price_yearly?: number | null;
          features?: Json;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          category?: string;
          icon?: string | null;
          price_monthly?: number;
          price_yearly?: number | null;
          stripe_product_id?: string | null;
          stripe_price_monthly?: string | null;
          stripe_price_yearly?: string | null;
          features?: Json;
          is_active?: boolean;
        };
      };
    };
  };
}
```

---

## 📐 Acceptance Criteria

- [ ] All migrations run without errors
- [ ] RLS policies protect data correctly
- [ ] Indexes improve query performance
- [ ] Triggers update timestamps automatically
- [ ] Profile created on user signup
- [ ] Module seed data present
- [ ] TypeScript types match schema

---

## 📁 Files Created This Phase

```
migrations/
├── 001_complete_schema.sql
├── 002_rls_policies.sql
├── 003_functions.sql
└── 004_seed_data.sql

src/types/
└── database.ts
```

---

## ➡️ Next Phase

**Phase 42: Production - Testing** - Comprehensive testing setup and test suites.
