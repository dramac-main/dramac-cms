# Phase 76A: Module System Architecture Overhaul

> **AI Model**: Claude Opus 4.5 (2x) ⭐ CRITICAL PHASE
>
> **Priority**: 🔴 CRITICAL - CORE BUSINESS MODEL
>
> **Estimated Time**: 15-20 hours
>
> **Consolidates**: Phase 29 (Foundation), Phase 35 (Billing), Phase 79 (Markup Pricing)
>
> **Payment Provider**: LemonSqueezy (Primary) - Unified billing across platform

---

## 🎯 Objective

Completely redesign the module/plugin system from the ground up using **industry-standard practices** (WordPress/Shopify plugin model). This transforms modules from basic feature flags into a **sandboxed, isolated plugin ecosystem** that:

1. **Cannot break the platform** - Fully isolated execution
2. **Installs at the correct level** - Client-level, Agency-level, and Site-level
3. **Enables recurring revenue** - Agencies resell with markup
4. **Supports external development** - Super Admin creates/manages modules
5. **Is truly modular** - Like mini-apps within the platform

---

## 📋 Prerequisites

- [ ] Current database schema understood
- [ ] Supabase configuration working
- [ ] LemonSqueezy billing integration functional
- [ ] LemonSqueezy webhook handler exists (`/api/webhooks/lemonsqueezy`)
- [ ] Client portal exists

---

## 🔍 Current State Analysis

### ❌ **WHAT'S BROKEN:**

```
Current Module Architecture (WRONG):
├── Modules are just React components imported directly
├── No isolation - broken module = broken platform
├── Only installs to SITES (not clients or agencies)
├── No permission system
├── No sandboxing
├── Agency can't resell with markup
├── Super Admin can't create modules via UI
└── Module code is compiled into main bundle
```

### ✅ **WHAT WE NEED:**

```
New Plugin Architecture (INDUSTRY STANDARD):
├── Plugins are isolated packages (like WordPress plugins)
├── Run in sandboxed environment (can't crash platform)
├── Install hierarchy:
│   ├── PLATFORM-LEVEL (available to all)
│   ├── AGENCY-LEVEL (agency tools)
│   ├── CLIENT-LEVEL (client tools - no site needed!)
│   └── SITE-LEVEL (website enhancements)
├── Permission system (what plugin can access)
├── Hook system (where plugin can inject)
├── Revenue sharing (Agency markup model)
├── Request system (Agencies request custom modules)
└── Module Development Studio (Super Admin creates)
```

---

## 🏗️ New Architecture Overview

### **Installation Hierarchy:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLATFORM LEVEL                            │
│  Super Admin owns/manages all modules                           │
│  Sets wholesale pricing                                          │
│  Controls availability                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│  AGENCY-LEVEL   │ │CLIENT-LEVEL │ │  SITE-LEVEL     │
│  Tools for      │ │ Apps for    │ │ Website         │
│  running the    │ │ clients     │ │ enhancements    │
│  agency itself  │ │ (no site    │ │ (SEO, forms,    │
│  (CRM, project  │ │  needed!)   │ │  analytics)     │
│  management)    │ │             │ │                 │
└─────────────────┘ └─────────────┘ └─────────────────┘
     Examples:          Examples:         Examples:
 - Agency CRM       - Grant Writer    - Google Analytics
 - Team Chat        - Invoice Tool    - Contact Forms
 - Project Mgmt     - Booking App     - SEO Optimizer
 - Lead Tracker     - Support Desk    - Live Chat
```

### **Revenue Flow:**

```
┌──────────────────────────────────────────────────────────────────┐
│                      REVENUE MODEL                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SUPER ADMIN sets wholesale price: $10/mo                        │
│                    │                                              │
│                    ▼                                              │
│  AGENCY adds markup: $10 + $15 = $25/mo (agency keeps $15)       │
│                    │                                              │
│                    ▼                                              │
│  CLIENT pays: $25/mo                                              │
│                    │                                              │
│         ┌─────────┴─────────┐                                    │
│         ▼                   ▼                                    │
│   Platform: $10        Agency: $15                               │
│   (wholesale)          (profit)                                  │
│                                                                   │
│  EVERYONE WINS!                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 New Database Schema

### **Core Module Tables:**

```sql
-- =============================================================
-- MODULES TABLE (Master definition - Super Admin controlled)
-- =============================================================
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  icon TEXT DEFAULT '📦',
  banner_image TEXT,
  
  -- Classification
  category TEXT NOT NULL, -- analytics, forms, crm, productivity, etc.
  tags TEXT[] DEFAULT '{}',
  
  -- CRITICAL: Installation Level
  install_level TEXT NOT NULL DEFAULT 'site', -- 'platform', 'agency', 'client', 'site'
  
  -- Versioning
  current_version TEXT NOT NULL DEFAULT '1.0.0',
  min_platform_version TEXT,
  
  -- Pricing (Wholesale - what agencies pay platform)
  pricing_type TEXT NOT NULL DEFAULT 'free', -- 'free', 'one_time', 'monthly', 'yearly'
  wholesale_price_monthly INTEGER DEFAULT 0, -- In cents
  wholesale_price_yearly INTEGER DEFAULT 0,
  wholesale_price_one_time INTEGER DEFAULT 0,
  suggested_retail_monthly INTEGER, -- Suggested markup price (guidance for agencies)
  suggested_retail_yearly INTEGER,
  
  -- LemonSqueezy Integration (Primary billing provider)
  lemon_product_id TEXT,                    -- LemonSqueezy product ID
  lemon_variant_monthly_id TEXT,            -- Monthly subscription variant
  lemon_variant_yearly_id TEXT,             -- Yearly subscription variant
  lemon_variant_one_time_id TEXT,           -- One-time purchase variant
  
  -- Stripe Integration (Legacy/backup)
  stripe_product_id TEXT,
  stripe_price_monthly_id TEXT,
  stripe_price_yearly_id TEXT,
  
  -- Capabilities & Permissions
  required_permissions TEXT[] DEFAULT '{}', -- What the module needs access to
  provided_hooks TEXT[] DEFAULT '{}', -- Where it can inject content
  
  -- Module Package (the actual code/content)
  package_url TEXT, -- CDN URL to module bundle
  package_hash TEXT, -- Integrity check
  manifest JSONB DEFAULT '{}', -- Module manifest (entry points, etc.)
  
  -- Settings Schema
  settings_schema JSONB DEFAULT '{}', -- JSON schema for configuration
  default_settings JSONB DEFAULT '{}',
  
  -- Metadata
  author_name TEXT DEFAULT 'DRAMAC',
  author_verified BOOLEAN DEFAULT TRUE,
  screenshots TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  changelog JSONB DEFAULT '[]',
  documentation_url TEXT,
  support_url TEXT,
  
  -- Stats
  install_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'review', 'active', 'deprecated', 'disabled'
  is_featured BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- =============================================================
-- AGENCY MODULE SUBSCRIPTIONS (Agency subscribes at wholesale)
-- =============================================================
CREATE TABLE agency_module_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Subscription Status
  status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'paused'
  billing_cycle TEXT DEFAULT 'monthly', -- 'monthly', 'yearly', 'one_time'
  
  -- LemonSqueezy Integration (Primary)
  lemon_subscription_id TEXT,               -- LemonSqueezy subscription ID
  lemon_order_id TEXT,                      -- For one-time purchases
  lemon_customer_id TEXT,                   -- LemonSqueezy customer
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Stripe Integration (Legacy/backup)
  stripe_subscription_id TEXT,
  stripe_subscription_item_id TEXT,
  
  -- Agency Markup Pricing (what agency charges clients) - FROM PHASE 79
  markup_type TEXT DEFAULT 'percentage', -- 'percentage', 'fixed', 'custom', 'passthrough'
  markup_percentage INTEGER DEFAULT 100, -- e.g., 100 = 100% markup (2x wholesale)
  markup_fixed_amount INTEGER DEFAULT 0, -- Fixed amount in cents to add
  custom_price_monthly INTEGER, -- Override price entirely
  custom_price_yearly INTEGER,
  retail_price_monthly_cached INTEGER, -- Cached calculated retail price
  retail_price_yearly_cached INTEGER,
  
  -- Usage Limits
  max_installations INTEGER, -- NULL = unlimited
  current_installations INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agency_id, module_id)
);

-- =============================================================
-- AGENCY LEVEL MODULE INSTALLATIONS (For agency tools)
-- =============================================================
CREATE TABLE agency_module_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES agency_module_subscriptions(id) ON DELETE SET NULL,
  
  -- Status
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Configuration
  settings JSONB DEFAULT '{}',
  
  -- Audit
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  installed_by UUID REFERENCES profiles(id),
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agency_id, module_id)
);

-- =============================================================
-- CLIENT LEVEL MODULE INSTALLATIONS (Client apps - no site needed!)
-- =============================================================
CREATE TABLE client_module_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  agency_subscription_id UUID REFERENCES agency_module_subscriptions(id) ON DELETE SET NULL,
  
  -- Billing (client pays agency's marked-up price)
  billing_status TEXT DEFAULT 'active',
  stripe_subscription_id TEXT, -- Client's subscription to agency
  price_paid INTEGER, -- What client actually pays (wholesale + markup)
  billing_cycle TEXT DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Status
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Configuration
  settings JSONB DEFAULT '{}',
  
  -- Audit
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  installed_by UUID REFERENCES profiles(id),
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(client_id, module_id)
);

-- =============================================================
-- SITE LEVEL MODULE INSTALLATIONS (Website enhancements)
-- =============================================================
CREATE TABLE site_module_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  client_installation_id UUID REFERENCES client_module_installations(id) ON DELETE SET NULL,
  agency_subscription_id UUID REFERENCES agency_module_subscriptions(id) ON DELETE SET NULL,
  
  -- Status
  is_enabled BOOLEAN DEFAULT TRUE,
  
  -- Configuration (site-specific overrides)
  settings JSONB DEFAULT '{}',
  
  -- Audit
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  installed_by UUID REFERENCES profiles(id),
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, module_id)
);

-- =============================================================
-- MODULE REQUESTS (Agencies request custom modules)
-- =============================================================
CREATE TABLE module_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Request Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  use_case TEXT, -- Why they need it
  target_audience TEXT, -- Who would use it
  
  -- Classification
  suggested_install_level TEXT DEFAULT 'client', -- 'agency', 'client', 'site'
  suggested_category TEXT,
  
  -- Priority & Budget
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  budget_range TEXT, -- 'free', '$1-50', '$50-200', '$200+'
  willing_to_fund BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'submitted', -- 'submitted', 'reviewing', 'approved', 'in_progress', 'completed', 'rejected'
  admin_notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  
  -- If built, link to module
  resulting_module_id UUID REFERENCES modules(id),
  
  -- Voting (other agencies can upvote)
  upvotes INTEGER DEFAULT 0,
  
  -- Audit
  submitted_by UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =============================================================
-- MODULE REVIEWS & RATINGS
-- =============================================================
CREATE TABLE module_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  
  -- Verification
  is_verified_purchase BOOLEAN DEFAULT FALSE, -- Did they actually subscribe?
  
  -- Moderation
  status TEXT DEFAULT 'published', -- 'pending', 'published', 'hidden'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(module_id, agency_id)
);

-- =============================================================
-- MODULE USAGE TRACKING
-- =============================================================
CREATE TABLE module_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  
  -- Context (where was it used)
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  
  -- Event
  event_type TEXT NOT NULL, -- 'load', 'action', 'error', 'api_call'
  event_name TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Performance
  load_time_ms INTEGER,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_agency_module_subs_agency ON agency_module_subscriptions(agency_id);
CREATE INDEX idx_agency_module_subs_module ON agency_module_subscriptions(module_id);
CREATE INDEX idx_client_module_inst_client ON client_module_installations(client_id);
CREATE INDEX idx_site_module_inst_site ON site_module_installations(site_id);
CREATE INDEX idx_module_usage_events_module ON module_usage_events(module_id);
CREATE INDEX idx_module_usage_events_created ON module_usage_events(created_at DESC);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_modules_install_level ON modules(install_level);
CREATE INDEX idx_modules_category ON modules(category);

-- =============================================================
-- PRICING CALCULATION FUNCTIONS (FROM PHASE 79)
-- =============================================================

-- Function to calculate retail price based on markup strategy
CREATE OR REPLACE FUNCTION calculate_retail_price(
  wholesale_cents INTEGER,
  markup_type TEXT,
  markup_percentage INTEGER,
  markup_fixed_amount INTEGER,
  custom_price INTEGER
) RETURNS INTEGER AS $$
BEGIN
  -- Custom price overrides everything
  IF markup_type = 'custom' AND custom_price IS NOT NULL THEN
    RETURN custom_price;
  END IF;
  
  -- Passthrough = no markup
  IF markup_type = 'passthrough' THEN
    RETURN wholesale_cents;
  END IF;
  
  -- Fixed = wholesale + fixed amount
  IF markup_type = 'fixed' THEN
    RETURN wholesale_cents + COALESCE(markup_fixed_amount, 0);
  END IF;
  
  -- Percentage (default) = wholesale + (wholesale * percentage / 100)
  -- Default 100% markup = 2x wholesale
  RETURN wholesale_cents + (wholesale_cents * COALESCE(markup_percentage, 100) / 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update cached retail prices when markup changes
CREATE OR REPLACE FUNCTION update_agency_module_retail_prices()
RETURNS TRIGGER AS $$
DECLARE
  wholesale_monthly INTEGER;
  wholesale_yearly INTEGER;
BEGIN
  -- Get wholesale prices from modules table
  SELECT wholesale_price_monthly, wholesale_price_yearly 
  INTO wholesale_monthly, wholesale_yearly
  FROM modules
  WHERE id = NEW.module_id;
  
  -- Calculate and cache retail prices
  NEW.retail_price_monthly_cached := calculate_retail_price(
    COALESCE(wholesale_monthly, 0),
    NEW.markup_type,
    NEW.markup_percentage,
    NEW.markup_fixed_amount,
    NEW.custom_price_monthly
  );
  
  NEW.retail_price_yearly_cached := calculate_retail_price(
    COALESCE(wholesale_yearly, 0),
    NEW.markup_type,
    NEW.markup_percentage,
    NEW.markup_fixed_amount,
    NEW.custom_price_yearly
  );
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_retail_prices
BEFORE INSERT OR UPDATE ON agency_module_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_agency_module_retail_prices();
```

---

## 🔌 Module Manifest Schema

Each module has a manifest that defines its capabilities:

```typescript
// src/lib/modules/types/module-manifest.ts

export interface ModuleManifest {
  // Identity
  id: string;
  slug: string;
  name: string;
  version: string;
  
  // Installation
  installLevel: 'platform' | 'agency' | 'client' | 'site';
  
  // Entry Points
  entryPoints: {
    // For site-level modules
    siteHead?: string; // Inject into <head>
    siteBody?: string; // Inject into <body>
    siteFooter?: string; // Before </body>
    
    // For dashboard modules
    dashboardWidget?: string; // Dashboard widget component
    dashboardPage?: string; // Full page route
    
    // For client portal modules
    portalWidget?: string;
    portalPage?: string;
    
    // For agency tools
    agencyWidget?: string;
    agencyPage?: string;
    
    // Settings panel
    settingsPanel?: string;
  };
  
  // Hooks - Where module can inject content
  hooks: ModuleHook[];
  
  // Permissions - What module needs access to
  permissions: ModulePermission[];
  
  // API Routes (if module needs backend)
  apiRoutes?: {
    path: string;
    methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
    handler: string; // Path to handler in package
  }[];
  
  // Settings Schema
  settingsSchema: JSONSchema;
  defaultSettings: Record<string, unknown>;
  
  // Dependencies
  dependencies?: string[]; // Other module slugs
  peerDependencies?: {
    module: string;
    version: string;
  }[];
}

export type ModuleHook = 
  // Site hooks
  | 'site:head'
  | 'site:body:start'
  | 'site:body:end'
  | 'site:footer'
  | 'site:page:before'
  | 'site:page:after'
  | 'site:section:before'
  | 'site:section:after'
  // Dashboard hooks
  | 'dashboard:sidebar'
  | 'dashboard:header'
  | 'dashboard:home:widget'
  | 'dashboard:client:tab'
  | 'dashboard:site:tab'
  // Client portal hooks
  | 'portal:sidebar'
  | 'portal:home:widget'
  | 'portal:header'
  // Agency hooks
  | 'agency:sidebar'
  | 'agency:home:widget';

export type ModulePermission =
  | 'read:site'
  | 'write:site'
  | 'read:client'
  | 'write:client'
  | 'read:agency'
  | 'write:agency'
  | 'read:analytics'
  | 'send:email'
  | 'access:storage'
  | 'access:api'
  | 'access:billing';
```

---

## 🛡️ Module Sandbox Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MAIN APPLICATION                             │
│                     (DRAMAC Platform)                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                 MODULE SANDBOX CONTAINER                    │ │
│  │                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │ │
│  │  │  Module A       │  │  Module B       │  │ Module C   │ │ │
│  │  │  (iframe)       │  │  (iframe)       │  │ (iframe)   │ │ │
│  │  │                 │  │                 │  │            │ │ │
│  │  │ Own React       │  │ Own React       │  │ Own React  │ │ │
│  │  │ Own State       │  │ Own State       │  │ Own State  │ │ │
│  │  │ Own Errors      │  │ Own Errors      │  │ Own Errors │ │ │
│  │  └────────┬────────┘  └────────┬────────┘  └─────┬──────┘ │ │
│  │           │                    │                  │        │ │
│  │           └────────────┬───────┴──────────────────┘        │ │
│  │                        │                                    │ │
│  │                        ▼                                    │ │
│  │           ┌────────────────────────┐                       │ │
│  │           │   MESSAGE BRIDGE       │                       │ │
│  │           │   (postMessage API)    │                       │ │
│  │           │   - Validated          │                       │ │
│  │           │   - Permission-checked │                       │ │
│  │           │   - Rate-limited       │                       │ │
│  │           └────────────────────────┘                       │ │
│  │                        │                                    │ │
│  └────────────────────────┼────────────────────────────────────┘ │
│                           │                                      │
│                           ▼                                      │
│              ┌────────────────────────┐                         │
│              │    PLATFORM API        │                         │
│              │    (Controlled Access) │                         │
│              └────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘

IF MODULE CRASHES:
└── Only that iframe breaks
└── Error boundary catches it
└── User can disable/uninstall
└── Platform continues running ✓
```

---

## ✅ Tasks

### Task 76A.1: Create New Database Migration

**File: `migrations/20260116_module_system_overhaul.sql`**

Create the complete new schema (see above).

---

### Task 76A.2: Module Types & Interfaces

**File: `src/lib/modules/types/index.ts`**

```typescript
export * from './module-manifest';
export * from './module-installation';
export * from './module-permissions';
export * from './module-hooks';
export * from './module-pricing';
```

**File: `src/lib/modules/types/module-installation.ts`**

```typescript
export type ModuleInstallLevel = 'platform' | 'agency' | 'client' | 'site';

export interface ModuleInstallation {
  id: string;
  moduleId: string;
  moduleName: string;
  moduleSlug: string;
  installLevel: ModuleInstallLevel;
  
  // Context
  agencyId?: string;
  clientId?: string;
  siteId?: string;
  
  // Status
  isEnabled: boolean;
  installedAt: Date;
  enabledAt?: Date;
  
  // Configuration
  settings: Record<string, unknown>;
  
  // Billing (for client installations)
  billingStatus?: string;
  pricePaid?: number;
}

export interface AgencyModuleSubscription {
  id: string;
  agencyId: string;
  moduleId: string;
  status: 'active' | 'canceled' | 'past_due' | 'paused';
  billingCycle: 'monthly' | 'yearly' | 'one_time';
  
  // Markup
  markupType: 'percentage' | 'fixed' | 'custom';
  markupPercentage?: number;
  markupFixedAmount?: number;
  customPriceMonthly?: number;
  customPriceYearly?: number;
  
  // Calculated
  wholesalePrice: number;
  clientPrice: number; // wholesale + markup
  
  // Usage
  maxInstallations?: number;
  currentInstallations: number;
}

export interface ClientModuleInstallation {
  id: string;
  clientId: string;
  moduleId: string;
  agencySubscriptionId?: string;
  
  // Billing
  billingStatus: string;
  pricePaid: number;
  billingCycle: string;
  
  isEnabled: boolean;
  settings: Record<string, unknown>;
  installedAt: Date;
}

export interface SiteModuleInstallation {
  id: string;
  siteId: string;
  moduleId: string;
  clientInstallationId?: string;
  
  isEnabled: boolean;
  settings: Record<string, unknown>;
  installedAt: Date;
}
```

---

### Task 76A.3: Module Sandbox Runtime

**File: `src/lib/modules/runtime/module-sandbox.tsx`**

```typescript
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ModuleManifest, ModulePermission } from "../types";

interface ModuleSandboxProps {
  module: {
    id: string;
    slug: string;
    packageUrl: string;
    manifest: ModuleManifest;
  };
  settings: Record<string, unknown>;
  context: {
    agencyId?: string;
    clientId?: string;
    siteId?: string;
    pageId?: string;
  };
  permissions: ModulePermission[];
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

export function ModuleSandbox({
  module,
  settings,
  context,
  permissions,
  onError,
  onLoad,
}: ModuleSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Handle messages from the sandboxed module
  const handleMessage = useCallback((event: MessageEvent) => {
    // Verify origin (should match module CDN)
    if (!isValidModuleOrigin(event.origin)) {
      console.warn(`Blocked message from unknown origin: ${event.origin}`);
      return;
    }

    const { type, payload, moduleId } = event.data;
    
    // Verify this message is from our module
    if (moduleId !== module.id) return;

    switch (type) {
      case 'MODULE_READY':
        setIsLoaded(true);
        onLoad?.();
        break;
        
      case 'MODULE_ERROR':
        setHasError(true);
        onError?.(new Error(payload.message));
        break;
        
      case 'API_REQUEST':
        // Check if module has permission for this request
        if (hasPermission(permissions, payload.permission)) {
          handleApiRequest(payload, moduleId);
        } else {
          sendToModule('API_DENIED', { 
            requestId: payload.requestId,
            reason: `Missing permission: ${payload.permission}` 
          });
        }
        break;
        
      case 'SETTINGS_UPDATE':
        // Module wants to update its settings
        if (hasPermission(permissions, 'write:settings')) {
          handleSettingsUpdate(payload);
        }
        break;
    }
  }, [module.id, permissions, onError, onLoad]);

  // Set up message listener
  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  // Send initial context to module once loaded
  useEffect(() => {
    if (isLoaded && iframeRef.current) {
      sendToModule('INIT', {
        moduleId: module.id,
        settings,
        context,
        permissions,
      });
    }
  }, [isLoaded, module.id, settings, context, permissions]);

  const sendToModule = (type: string, payload: unknown) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type, payload, moduleId: module.id },
      module.packageUrl
    );
  };

  if (hasError) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
        <p className="text-sm text-destructive">
          Module "{module.slug}" failed to load. 
          <button 
            onClick={() => setHasError(false)}
            className="ml-2 underline"
          >
            Retry
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="module-sandbox relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={module.packageUrl}
        sandbox="allow-scripts allow-same-origin allow-forms"
        className="w-full border-0"
        style={{ minHeight: 100 }}
        title={`Module: ${module.slug}`}
        onError={() => {
          setHasError(true);
          onError?.(new Error(`Failed to load module: ${module.slug}`));
        }}
      />
    </div>
  );
}

function isValidModuleOrigin(origin: string): boolean {
  // Module packages should come from our CDN or approved sources
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_MODULE_CDN_URL,
    'https://modules.dramac.app',
    // Add more allowed origins
  ];
  return allowedOrigins.some(allowed => origin.startsWith(allowed || ''));
}

function hasPermission(
  granted: ModulePermission[], 
  required: ModulePermission
): boolean {
  return granted.includes(required);
}

async function handleApiRequest(
  payload: { requestId: string; endpoint: string; method: string; data?: unknown },
  moduleId: string
) {
  // Proxy API requests from module through our server
  // This ensures modules can't make unauthorized requests
  try {
    const response = await fetch(`/api/modules/${moduleId}/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    // Send result back to module
    // Implementation continues...
  } catch (error) {
    console.error('Module API request failed:', error);
  }
}

async function handleSettingsUpdate(payload: unknown) {
  // Save module settings
  // Implementation...
}
```

---

### Task 76A.4: Module Error Boundary

**File: `src/lib/modules/runtime/module-error-boundary.tsx`**

```typescript
"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ModuleErrorBoundaryProps {
  children: React.ReactNode;
  moduleId: string;
  moduleName: string;
  onUninstall?: () => void;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ModuleErrorBoundary extends React.Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to module error tracking
    console.error(`Module Error [${this.props.moduleId}]:`, error, errorInfo);
    
    // Report to platform analytics
    fetch('/api/modules/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId: this.props.moduleId,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }),
    }).catch(() => {});
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">Module Error</CardTitle>
            </div>
            <CardDescription>
              The "{this.props.moduleName}" module encountered an error
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This error only affects this module. The rest of the platform 
              is working normally.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="p-3 bg-muted rounded text-xs overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={this.handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              {this.props.onUninstall && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={this.props.onUninstall}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disable Module
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

---

### Task 76A.5: Module Installation Service

**File: `src/lib/modules/services/installation-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  ModuleInstallLevel, 
  AgencyModuleSubscription,
  ClientModuleInstallation,
  SiteModuleInstallation,
} from "../types";

export interface InstallModuleParams {
  moduleId: string;
  installLevel: ModuleInstallLevel;
  agencyId: string;
  clientId?: string;
  siteId?: string;
  settings?: Record<string, unknown>;
}

export interface InstallResult {
  success: boolean;
  error?: string;
  installationId?: string;
}

/**
 * Install a module at the appropriate level
 */
export async function installModule(
  params: InstallModuleParams
): Promise<InstallResult> {
  const supabase = await createClient();
  const { moduleId, installLevel, agencyId, clientId, siteId, settings = {} } = params;

  // 1. Verify module exists and matches install level
  const { data: module, error: moduleError } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .eq("status", "active")
    .single();

  if (moduleError || !module) {
    return { success: false, error: "Module not found or inactive" };
  }

  if (module.install_level !== installLevel) {
    return { 
      success: false, 
      error: `Module can only be installed at ${module.install_level} level` 
    };
  }

  // 2. Verify agency has subscription to this module
  const { data: subscription } = await supabase
    .from("agency_module_subscriptions")
    .select("*")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .eq("status", "active")
    .single();

  // Free modules don't require subscription
  if (!subscription && module.pricing_type !== 'free') {
    return { success: false, error: "Agency must subscribe to this module first" };
  }

  // 3. Install based on level
  switch (installLevel) {
    case 'agency':
      return installForAgency(supabase, moduleId, agencyId, subscription?.id, settings);
      
    case 'client':
      if (!clientId) {
        return { success: false, error: "Client ID required for client-level installation" };
      }
      return installForClient(supabase, moduleId, clientId, agencyId, subscription?.id, settings);
      
    case 'site':
      if (!siteId) {
        return { success: false, error: "Site ID required for site-level installation" };
      }
      return installForSite(supabase, moduleId, siteId, agencyId, clientId, subscription?.id, settings);
      
    default:
      return { success: false, error: "Invalid install level" };
  }
}

async function installForAgency(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  moduleId: string,
  agencyId: string,
  subscriptionId: string | undefined,
  settings: Record<string, unknown>
): Promise<InstallResult> {
  // Check if already installed
  const { data: existing } = await supabase
    .from("agency_module_installations")
    .select("id")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Module already installed for this agency" };
  }

  const { data, error } = await supabase
    .from("agency_module_installations")
    .insert({
      agency_id: agencyId,
      module_id: moduleId,
      subscription_id: subscriptionId,
      is_enabled: true,
      settings,
      installed_at: new Date().toISOString(),
      enabled_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Agency module installation error:", error);
    return { success: false, error: "Failed to install module" };
  }

  // Update subscription installation count
  if (subscriptionId) {
    await supabase.rpc('increment_module_installations', { sub_id: subscriptionId });
  }

  return { success: true, installationId: data.id };
}

async function installForClient(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  moduleId: string,
  clientId: string,
  agencyId: string,
  subscriptionId: string | undefined,
  settings: Record<string, unknown>
): Promise<InstallResult> {
  // Verify client belongs to agency
  const { data: client } = await supabase
    .from("clients")
    .select("id, agency_id")
    .eq("id", clientId)
    .single();

  if (!client || client.agency_id !== agencyId) {
    return { success: false, error: "Client not found or doesn't belong to agency" };
  }

  // Check if already installed
  const { data: existing } = await supabase
    .from("client_module_installations")
    .select("id")
    .eq("client_id", clientId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Module already installed for this client" };
  }

  // Get pricing for client
  const clientPrice = await calculateClientPrice(supabase, moduleId, agencyId);

  const { data, error } = await supabase
    .from("client_module_installations")
    .insert({
      client_id: clientId,
      module_id: moduleId,
      agency_subscription_id: subscriptionId,
      billing_status: "active",
      price_paid: clientPrice,
      billing_cycle: "monthly",
      is_enabled: true,
      settings,
      installed_at: new Date().toISOString(),
      enabled_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Client module installation error:", error);
    return { success: false, error: "Failed to install module" };
  }

  // Update subscription installation count
  if (subscriptionId) {
    await supabase.rpc('increment_module_installations', { sub_id: subscriptionId });
  }

  return { success: true, installationId: data.id };
}

async function installForSite(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  moduleId: string,
  siteId: string,
  agencyId: string,
  clientId: string | undefined,
  subscriptionId: string | undefined,
  settings: Record<string, unknown>
): Promise<InstallResult> {
  // Verify site belongs to agency
  const { data: site } = await supabase
    .from("sites")
    .select("id, agency_id, client_id")
    .eq("id", siteId)
    .single();

  if (!site || site.agency_id !== agencyId) {
    return { success: false, error: "Site not found or doesn't belong to agency" };
  }

  // For site-level modules, check if client has the module installed (if applicable)
  let clientInstallationId: string | undefined;
  if (site.client_id) {
    const { data: clientInstall } = await supabase
      .from("client_module_installations")
      .select("id")
      .eq("client_id", site.client_id)
      .eq("module_id", moduleId)
      .maybeSingle();
    
    clientInstallationId = clientInstall?.id;
  }

  // Check if already installed
  const { data: existing } = await supabase
    .from("site_module_installations")
    .select("id")
    .eq("site_id", siteId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Module already installed for this site" };
  }

  const { data, error } = await supabase
    .from("site_module_installations")
    .insert({
      site_id: siteId,
      module_id: moduleId,
      client_installation_id: clientInstallationId,
      agency_subscription_id: subscriptionId,
      is_enabled: true,
      settings,
      installed_at: new Date().toISOString(),
      enabled_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Site module installation error:", error);
    return { success: false, error: "Failed to install module" };
  }

  // Update subscription installation count
  if (subscriptionId) {
    await supabase.rpc('increment_module_installations', { sub_id: subscriptionId });
  }

  return { success: true, installationId: data.id };
}

/**
 * Calculate what client pays (wholesale + agency markup)
 */
async function calculateClientPrice(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  moduleId: string,
  agencyId: string
): Promise<number> {
  // Get module wholesale price
  const { data: module } = await supabase
    .from("modules")
    .select("wholesale_price_monthly")
    .eq("id", moduleId)
    .single();

  if (!module) return 0;

  const wholesalePrice = module.wholesale_price_monthly;

  // Get agency markup
  const { data: subscription } = await supabase
    .from("agency_module_subscriptions")
    .select("markup_type, markup_percentage, markup_fixed_amount, custom_price_monthly")
    .eq("agency_id", agencyId)
    .eq("module_id", moduleId)
    .single();

  if (!subscription) return wholesalePrice;

  switch (subscription.markup_type) {
    case 'percentage':
      return Math.round(wholesalePrice * (1 + (subscription.markup_percentage || 0) / 100));
    case 'fixed':
      return wholesalePrice + (subscription.markup_fixed_amount || 0);
    case 'custom':
      return subscription.custom_price_monthly || wholesalePrice;
    default:
      return wholesalePrice;
  }
}
```

---

### Task 76A.5b: Module Pricing Service (FROM PHASE 79)

**File: `src/lib/modules/services/pricing-service.ts`**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================
// TYPES
// ============================================================

export interface WholesalePricing {
  moduleId: string;
  moduleName: string;
  wholesalePriceMonthly: number; // In cents
  wholesalePriceYearly: number;
  wholesalePriceOneTime: number;
  pricingType: "free" | "monthly" | "yearly" | "one_time";
  suggestedRetailMonthly: number;
  suggestedRetailYearly: number;
  lemonProductId: string | null;
  lemonVariantMonthlyId: string | null;
  lemonVariantYearlyId: string | null;
}

export interface AgencyModulePricing {
  moduleId: string;
  moduleName: string;
  
  // Agency's markup configuration
  markupType: "percentage" | "fixed" | "custom" | "passthrough";
  markupPercentage: number;
  markupFixedAmount: number;
  customPriceMonthly: number | null;
  customPriceYearly: number | null;
  
  // Calculated prices
  wholesalePriceMonthly: number;
  wholesalePriceYearly: number;
  retailPriceMonthly: number;
  retailPriceYearly: number;
  profitMonthly: number;
  profitYearly: number;
  
  // Status
  isSubscribed: boolean;
  subscriptionStatus: string | null;
  lemonSubscriptionId: string | null;
}

export interface ClientModulePriceContext {
  moduleId: string;
  moduleName: string;
  wholesalePriceCents: number;
  retailPriceCents: number;
  agencyProfitCents: number;
  billingCycle: string;
  isAvailable: boolean;
}

// ============================================================
// SUPER ADMIN FUNCTIONS
// ============================================================

/**
 * Get all wholesale pricing (Super Admin view)
 */
export async function getAllWholesalePricing(): Promise<WholesalePricing[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("modules")
    .select(`
      id, name, 
      wholesale_price_monthly, wholesale_price_yearly, wholesale_price_one_time,
      pricing_type, suggested_retail_monthly, suggested_retail_yearly,
      lemon_product_id, lemon_variant_monthly_id, lemon_variant_yearly_id
    `)
    .eq("status", "active")
    .order("name");

  if (error) {
    console.error("[PricingService] Get wholesale error:", error);
    return [];
  }

  return data.map((m) => ({
    moduleId: m.id,
    moduleName: m.name,
    wholesalePriceMonthly: m.wholesale_price_monthly || 0,
    wholesalePriceYearly: m.wholesale_price_yearly || 0,
    wholesalePriceOneTime: m.wholesale_price_one_time || 0,
    pricingType: m.pricing_type || "free",
    suggestedRetailMonthly: m.suggested_retail_monthly || (m.wholesale_price_monthly || 0) * 2,
    suggestedRetailYearly: m.suggested_retail_yearly || (m.wholesale_price_yearly || 0) * 2,
    lemonProductId: m.lemon_product_id,
    lemonVariantMonthlyId: m.lemon_variant_monthly_id,
    lemonVariantYearlyId: m.lemon_variant_yearly_id,
  }));
}

/**
 * Set wholesale price for a module (Super Admin)
 */
export async function setWholesalePrice(
  moduleId: string,
  pricing: {
    wholesalePriceMonthly?: number;
    wholesalePriceYearly?: number;
    wholesalePriceOneTime?: number;
    pricingType?: "free" | "monthly" | "yearly" | "one_time";
    suggestedRetailMonthly?: number;
    suggestedRetailYearly?: number;
    lemonProductId?: string;
    lemonVariantMonthlyId?: string;
    lemonVariantYearlyId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("modules")
    .update({
      wholesale_price_monthly: pricing.wholesalePriceMonthly,
      wholesale_price_yearly: pricing.wholesalePriceYearly,
      wholesale_price_one_time: pricing.wholesalePriceOneTime,
      pricing_type: pricing.pricingType,
      suggested_retail_monthly: pricing.suggestedRetailMonthly,
      suggested_retail_yearly: pricing.suggestedRetailYearly,
      lemon_product_id: pricing.lemonProductId,
      lemon_variant_monthly_id: pricing.lemonVariantMonthlyId,
      lemon_variant_yearly_id: pricing.lemonVariantYearlyId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", moduleId);

  if (error) {
    console.error("[PricingService] Set wholesale error:", error);
    return { success: false, error: "Failed to update pricing" };
  }

  return { success: true };
}

// ============================================================
// AGENCY FUNCTIONS
// ============================================================

/**
 * Get agency's module pricing configuration
 */
export async function getAgencyModulePricing(
  agencyId: string
): Promise<AgencyModulePricing[]> {
  const supabase = await createClient();

  // Get all active modules
  const { data: modules } = await supabase
    .from("modules")
    .select("id, name, wholesale_price_monthly, wholesale_price_yearly")
    .eq("status", "active");

  // Get agency's subscriptions
  const { data: subscriptions } = await supabase
    .from("agency_module_subscriptions")
    .select("*")
    .eq("agency_id", agencyId);

  const subMap = new Map(subscriptions?.map((s) => [s.module_id, s]) || []);

  return (modules || []).map((m) => {
    const sub = subMap.get(m.id);
    const wholesaleMonthly = m.wholesale_price_monthly || 0;
    const wholesaleYearly = m.wholesale_price_yearly || 0;
    
    // Calculate retail based on markup
    let retailMonthly = wholesaleMonthly;
    let retailYearly = wholesaleYearly;
    
    if (sub) {
      switch (sub.markup_type) {
        case "percentage":
          const pct = sub.markup_percentage || 100;
          retailMonthly = wholesaleMonthly + (wholesaleMonthly * pct / 100);
          retailYearly = wholesaleYearly + (wholesaleYearly * pct / 100);
          break;
        case "fixed":
          const fixed = sub.markup_fixed_amount || 0;
          retailMonthly = wholesaleMonthly + fixed;
          retailYearly = wholesaleYearly + fixed;
          break;
        case "custom":
          retailMonthly = sub.custom_price_monthly || wholesaleMonthly;
          retailYearly = sub.custom_price_yearly || wholesaleYearly;
          break;
        case "passthrough":
          // No markup
          break;
      }
    } else {
      // Default: 100% markup for non-subscribed modules
      retailMonthly = wholesaleMonthly * 2;
      retailYearly = wholesaleYearly * 2;
    }

    return {
      moduleId: m.id,
      moduleName: m.name,
      markupType: sub?.markup_type || "percentage",
      markupPercentage: sub?.markup_percentage || 100,
      markupFixedAmount: sub?.markup_fixed_amount || 0,
      customPriceMonthly: sub?.custom_price_monthly || null,
      customPriceYearly: sub?.custom_price_yearly || null,
      wholesalePriceMonthly: wholesaleMonthly,
      wholesalePriceYearly: wholesaleYearly,
      retailPriceMonthly: retailMonthly,
      retailPriceYearly: retailYearly,
      profitMonthly: retailMonthly - wholesaleMonthly,
      profitYearly: retailYearly - wholesaleYearly,
      isSubscribed: !!sub,
      subscriptionStatus: sub?.status || null,
      lemonSubscriptionId: sub?.lemon_subscription_id || null,
    };
  });
}

/**
 * Set agency's markup for a module
 */
export async function setAgencyModuleMarkup(
  agencyId: string,
  moduleId: string,
  config: {
    markupType: "percentage" | "fixed" | "custom" | "passthrough";
    markupPercentage?: number;
    markupFixedAmount?: number;
    customPriceMonthly?: number;
    customPriceYearly?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Upsert the subscription/pricing config
  const { error } = await supabase
    .from("agency_module_subscriptions")
    .upsert(
      {
        agency_id: agencyId,
        module_id: moduleId,
        markup_type: config.markupType,
        markup_percentage: config.markupPercentage ?? 100,
        markup_fixed_amount: config.markupFixedAmount ?? 0,
        custom_price_monthly: config.customPriceMonthly,
        custom_price_yearly: config.customPriceYearly,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "agency_id,module_id" }
    );

  if (error) {
    console.error("[PricingService] Set markup error:", error);
    return { success: false, error: "Failed to update markup" };
  }

  return { success: true };
}

// ============================================================
// CLIENT PRICING FUNCTIONS
// ============================================================

/**
 * Get module price for a client (shows agency's retail price)
 */
export async function getModulePriceForClient(
  clientId: string,
  moduleId: string
): Promise<ClientModulePriceContext | null> {
  const supabase = await createClient();

  // Get client's agency
  const { data: client } = await supabase
    .from("clients")
    .select("agency_id")
    .eq("id", clientId)
    .single();

  if (!client) return null;

  // Get module wholesale price
  const { data: module } = await supabase
    .from("modules")
    .select("id, name, wholesale_price_monthly, pricing_type, status")
    .eq("id", moduleId)
    .single();

  if (!module || module.status !== "active") return null;

  // Get agency's markup
  const { data: subscription } = await supabase
    .from("agency_module_subscriptions")
    .select("markup_type, markup_percentage, markup_fixed_amount, custom_price_monthly, retail_price_monthly_cached, status")
    .eq("agency_id", client.agency_id)
    .eq("module_id", moduleId)
    .single();

  const wholesaleCents = module.wholesale_price_monthly || 0;
  
  // If agency hasn't subscribed, module isn't available to client
  if (!subscription || subscription.status !== "active") {
    return {
      moduleId,
      moduleName: module.name,
      wholesalePriceCents: wholesaleCents,
      retailPriceCents: wholesaleCents * 2, // Suggested price
      agencyProfitCents: wholesaleCents,
      billingCycle: module.pricing_type || "monthly",
      isAvailable: false,
    };
  }

  // Use cached retail price or calculate
  const retailCents = subscription.retail_price_monthly_cached || 
    calculateRetailPrice(
      wholesaleCents,
      subscription.markup_type,
      subscription.markup_percentage,
      subscription.markup_fixed_amount,
      subscription.custom_price_monthly
    );

  return {
    moduleId,
    moduleName: module.name,
    wholesalePriceCents: wholesaleCents,
    retailPriceCents: retailCents,
    agencyProfitCents: retailCents - wholesaleCents,
    billingCycle: module.pricing_type || "monthly",
    isAvailable: true,
  };
}

// Helper function (mirrors SQL function)
function calculateRetailPrice(
  wholesaleCents: number,
  markupType: string,
  markupPercentage: number | null,
  markupFixedAmount: number | null,
  customPrice: number | null
): number {
  if (markupType === "custom" && customPrice != null) {
    return customPrice;
  }
  if (markupType === "passthrough") {
    return wholesaleCents;
  }
  if (markupType === "fixed") {
    return wholesaleCents + (markupFixedAmount || 0);
  }
  // percentage (default)
  return wholesaleCents + (wholesaleCents * (markupPercentage || 100) / 100);
}
```

---

### Task 76A.6: Module Context Provider (Updated)

**File: `src/lib/modules/context/module-provider.tsx`**

```typescript
"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { ModuleManifest, ModuleInstallation, ModuleInstallLevel } from "../types";

export interface LoadedModule {
  id: string;
  slug: string;
  name: string;
  manifest: ModuleManifest;
  settings: Record<string, unknown>;
  installLevel: ModuleInstallLevel;
  packageUrl: string;
}

interface ModuleContextValue {
  // All loaded modules
  modules: LoadedModule[];
  
  // Filtered by level
  agencyModules: LoadedModule[];
  clientModules: LoadedModule[];
  siteModules: LoadedModule[];
  
  // Utilities
  isModuleEnabled: (slug: string) => boolean;
  getModule: (slug: string) => LoadedModule | undefined;
  getModuleSettings: (slug: string) => Record<string, unknown>;
  getModulesForHook: (hook: string) => LoadedModule[];
  
  // Context
  agencyId?: string;
  clientId?: string;
  siteId?: string;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

interface ModuleProviderProps {
  children: ReactNode;
  modules: LoadedModule[];
  agencyId?: string;
  clientId?: string;
  siteId?: string;
}

export function ModuleProvider({
  children,
  modules,
  agencyId,
  clientId,
  siteId,
}: ModuleProviderProps) {
  const value = useMemo(() => {
    const moduleMap = new Map(modules.map((m) => [m.slug, m]));
    
    return {
      modules,
      
      agencyModules: modules.filter((m) => m.installLevel === 'agency'),
      clientModules: modules.filter((m) => m.installLevel === 'client'),
      siteModules: modules.filter((m) => m.installLevel === 'site'),
      
      isModuleEnabled: (slug: string) => moduleMap.has(slug),
      
      getModule: (slug: string) => moduleMap.get(slug),
      
      getModuleSettings: (slug: string) => {
        const mod = moduleMap.get(slug);
        return mod?.settings || {};
      },
      
      getModulesForHook: (hook: string) => {
        return modules.filter((m) => m.manifest.hooks.includes(hook as any));
      },
      
      agencyId,
      clientId,
      siteId,
    };
  }, [modules, agencyId, clientId, siteId]);

  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error("useModules must be used within ModuleProvider");
  }
  return context;
}

export function useModule(slug: string) {
  const { getModule, getModuleSettings, isModuleEnabled } = useModules();
  
  return {
    module: getModule(slug),
    settings: getModuleSettings(slug),
    isEnabled: isModuleEnabled(slug),
  };
}

export function useModulesForHook(hook: string) {
  const { getModulesForHook } = useModules();
  return getModulesForHook(hook);
}
```

---

### Task 76A.7: Module Hook System

**File: `src/lib/modules/hooks/module-hook-renderer.tsx`**

```typescript
"use client";

import { useModulesForHook } from "../context/module-provider";
import { ModuleSandbox } from "../runtime/module-sandbox";
import { ModuleErrorBoundary } from "../runtime/module-error-boundary";
import { ModuleHook } from "../types";

interface ModuleHookRendererProps {
  hook: ModuleHook;
  context?: Record<string, unknown>;
}

/**
 * Renders all modules registered for a specific hook
 * Usage: <ModuleHookRenderer hook="dashboard:home:widget" />
 */
export function ModuleHookRenderer({ hook, context = {} }: ModuleHookRendererProps) {
  const modules = useModulesForHook(hook);

  if (modules.length === 0) {
    return null;
  }

  return (
    <div className="module-hook-container space-y-4" data-hook={hook}>
      {modules.map((module) => (
        <ModuleErrorBoundary
          key={module.id}
          moduleId={module.id}
          moduleName={module.name}
        >
          <ModuleSandbox
            module={{
              id: module.id,
              slug: module.slug,
              packageUrl: module.packageUrl,
              manifest: module.manifest,
            }}
            settings={module.settings}
            context={context as any}
            permissions={module.manifest.permissions}
          />
        </ModuleErrorBoundary>
      ))}
    </div>
  );
}
```

---

## 📊 Migration Strategy

### Phase 1: Database (This Phase)
1. Create new tables alongside existing ones
2. No data migration yet
3. Both old and new systems work

### Phase 2: UI (Phase 76B)
1. Build new marketplace UI
2. Build installation flows
3. Admin module management

### Phase 3: Migration
1. Migrate existing `site_modules` to `site_module_installations`
2. Deprecate old tables
3. Full cutover

---

## ✅ Verification Checklist

- [ ] New database schema created
- [ ] Module types defined
- [ ] Sandbox runtime working
- [ ] Error boundary catches crashes
- [ ] Installation service handles all levels
- [ ] Module provider updated
- [ ] Hook system renders modules
- [ ] API proxy secures module requests
- [ ] Permissions system enforced
- [ ] Build passes with no TypeScript errors

---

## 📝 Notes

- This phase focuses on **architecture** and **backend**
- Phase 76B will focus on **UI** and **user flows**
- Module packages will be stored on CDN (Vercel Blob or S3)
- Modules communicate via `postMessage` only
- All API calls proxied through platform for security

---

**Next Phase**: PHASE-76B-MODULE-MARKETPLACE-AND-MANAGEMENT-UI.md
