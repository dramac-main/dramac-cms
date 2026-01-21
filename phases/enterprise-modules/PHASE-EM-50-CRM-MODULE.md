# Phase EM-50: CRM Module - Enterprise Ready

> **Priority**: 🟠 HIGH (First Enterprise Module)
> **Estimated Time**: 2-3 weeks
> **Prerequisites**: EM-01, EM-10, EM-11, EM-12
> **Status**: 📋 READY TO IMPLEMENT
> **Module Type**: System

---

## 🔗 How This Module Uses Platform Services

This CRM module is a **reference implementation** showing how to build enterprise modules:

| Service | From Phase | Usage in CRM |
|---------|------------|--------------|
| Database Provisioning | EM-11 | Creates `mod_{short_id}` schema with all CRM tables |
| API Gateway | EM-12 | Exposes `/contacts`, `/deals`, `/companies` endpoints |
| Module Naming | EM-05 | All tables use `${SCHEMA}.` prefix for isolation |
| Type System | EM-10 | Module type = `system` (full schema isolation) |
| Module Lifecycle | EM-01 | Syncs to marketplace, handles install/uninstall |

**Files Created by This Module:**
- `src/modules/crm/components/*` - React UI components
- `src/modules/crm/context/crm-context.tsx` - CRM state management
- `src/modules/crm/api/routes.ts` - API route definitions
- `migrations/modules/crm/001_crm_core_tables.sql` - Database schema

---

## 🎯 Objective

Build a **production-ready CRM module** that rivals Salesforce Essentials and HubSpot CRM. This will be the flagship enterprise module demonstrating the platform's capability to build complex business applications.

### Features Comparison

| Feature | Salesforce | HubSpot | Our CRM |
|---------|-----------|---------|---------|
| Contact Management | ✅ | ✅ | ✅ |
| Company/Account Mgmt | ✅ | ✅ | ✅ |
| Deal/Opportunity Pipeline | ✅ | ✅ | ✅ |
| Activity Tracking | ✅ | ✅ | ✅ |
| Email Integration | ✅ | ✅ | ✅ |
| Task Management | ✅ | ✅ | ✅ |
| Reporting Dashboard | ✅ | ✅ | ✅ |
| Custom Fields | ✅ | ✅ | ✅ |
| Automation/Workflows | ✅ | ✅ | Phase 2 |
| API Access | ✅ | ✅ | ✅ |
| White-label | ❌ | ❌ | ✅ |
| Self-hosted option | ❌ | ❌ | ✅ |

---

## 🔗 CRM ↔ Accounting Integration (EM-55)

> **📌 IMPORTANT**: Invoicing, recurring billing, and payment processing are handled by **[EM-55 Accounting Module](./PHASE-EM-55-ACCOUNTING-MODULE.md)** - NOT in CRM.
> 
> This follows industry best practice (Salesforce + QuickBooks, HubSpot + Xero, Zoho CRM + Zoho Books).

### Why Separate?

| Concern | CRM (EM-50) | Accounting (EM-55) |
|---------|-------------|-------------------|
| **Primary Focus** | Sales pipeline, relationships | Financial transactions |
| **Data Type** | Opportunities (potential) | Invoices (committed) |
| **Compliance** | None | Tax, audit trails |
| **Users** | Sales team | Finance team |

### Integration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SALES WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CRM (EM-50)                        Accounting (EM-55)              │
│  ┌──────────────┐                   ┌──────────────┐                │
│  │    DEAL      │   Deal Won        │   INVOICE    │                │
│  │  $10,000     │ ───────────────►  │  INV-001     │                │
│  │  Pipeline    │                   │  $10,000     │                │
│  └──────────────┘                   └──────────────┘                │
│         │                                  │                         │
│         │ Contact/Company                  │ Client                  │
│         ▼                                  ▼                         │
│  ┌──────────────┐     Sync           ┌──────────────┐               │
│  │   CONTACT    │ ◄──────────────►   │   CLIENT     │               │
│  │ John Doe     │                    │ John Doe     │               │
│  │ Acme Inc     │                    │ Acme Inc     │               │
│  └──────────────┘                    └──────────────┘               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Integration Server Action

```typescript
// src/modules/crm/actions/crm-accounting-integration.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { generateModuleShortId, getModuleSchemaName } from '@/lib/modules/module-naming'

const CRM_MODULE_ID = 'crm-module-uuid'
const ACCOUNTING_MODULE_ID = 'accounting-module-uuid'

/**
 * When a deal is marked as WON, optionally create an invoice in the Accounting module
 */
export async function createInvoiceFromDeal(siteId: string, dealId: string): Promise<{ invoiceId?: string; error?: string }> {
  const supabase = await createClient()
  
  const crmSchema = getModuleSchemaName(generateModuleShortId(CRM_MODULE_ID))
  const accSchema = getModuleSchemaName(generateModuleShortId(ACCOUNTING_MODULE_ID))
  
  // 1. Get the deal details
  const { data: deal, error: dealError } = await supabase
    .from(`${crmSchema}.deals`)
    .select(`
      *,
      contact:contacts(*),
      company:companies(*)
    `)
    .eq('id', dealId)
    .single()
  
  if (dealError || !deal) {
    return { error: 'Deal not found' }
  }
  
  if (deal.status !== 'won') {
    return { error: 'Can only create invoices for won deals' }
  }
  
  // 2. Find or create client in Accounting module
  let clientId: string | null = null
  
  // Check if client already exists (by email)
  if (deal.contact?.email) {
    const { data: existingClient } = await supabase
      .from(`${accSchema}.clients`)
      .select('id')
      .eq('site_id', siteId)
      .eq('email', deal.contact.email)
      .maybeSingle()
    
    if (existingClient) {
      clientId = existingClient.id
    }
  }
  
  // Create client if not found
  if (!clientId) {
    const { data: newClient, error: clientError } = await supabase
      .from(`${accSchema}.clients`)
      .insert({
        site_id: siteId,
        tenant_id: deal.site_id, // or appropriate tenant
        name: deal.company?.name || `${deal.contact?.first_name} ${deal.contact?.last_name}`.trim() || 'Unknown',
        email: deal.contact?.email,
        phone: deal.contact?.phone,
        billing_address_line1: deal.company?.address_line_1 || deal.contact?.address_line_1,
        billing_city: deal.company?.city || deal.contact?.city,
        billing_state: deal.company?.state || deal.contact?.state,
        billing_postal_code: deal.company?.postal_code || deal.contact?.postal_code,
        billing_country: deal.company?.country || deal.contact?.country || 'US',
        crm_contact_id: deal.contact?.id, // Link back to CRM
        crm_company_id: deal.company?.id
      })
      .select('id')
      .single()
    
    if (clientError) {
      return { error: `Failed to create client: ${clientError.message}` }
    }
    clientId = newClient.id
  }
  
  // 3. Generate invoice number
  const { data: lastInvoice } = await supabase
    .from(`${accSchema}.invoices`)
    .select('invoice_number')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  const nextNumber = lastInvoice 
    ? parseInt(lastInvoice.invoice_number.replace(/\D/g, ''), 10) + 1 
    : 1
  const invoiceNumber = `INV-${String(nextNumber).padStart(5, '0')}`
  
  // 4. Create the invoice
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30) // Net 30
  
  const { data: invoice, error: invoiceError } = await supabase
    .from(`${accSchema}.invoices`)
    .insert({
      site_id: siteId,
      tenant_id: deal.site_id,
      invoice_number: invoiceNumber,
      type: 'invoice',
      client_id: clientId,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      status: 'draft',
      subtotal: deal.amount || 0,
      total: deal.amount || 0,
      currency: deal.currency || 'USD',
      notes: `Generated from CRM Deal: ${deal.name}`,
      reference: `Deal ID: ${deal.id}`,
      created_by: deal.owner_id
    })
    .select('id')
    .single()
  
  if (invoiceError) {
    return { error: `Failed to create invoice: ${invoiceError.message}` }
  }
  
  // 5. Create invoice line item
  await supabase
    .from(`${accSchema}.invoice_items`)
    .insert({
      invoice_id: invoice.id,
      description: deal.name,
      quantity: 1,
      unit_price: deal.amount || 0,
      total: deal.amount || 0
    })
  
  // 6. Update deal with invoice reference
  await supabase
    .from(`${crmSchema}.deals`)
    .update({ 
      custom_fields: { 
        ...deal.custom_fields, 
        accounting_invoice_id: invoice.id 
      } 
    })
    .eq('id', dealId)
  
  return { invoiceId: invoice.id }
}

/**
 * Sync contact to accounting client
 */
export async function syncContactToClient(siteId: string, contactId: string): Promise<{ clientId?: string; error?: string }> {
  const supabase = await createClient()
  
  const crmSchema = getModuleSchemaName(generateModuleShortId(CRM_MODULE_ID))
  const accSchema = getModuleSchemaName(generateModuleShortId(ACCOUNTING_MODULE_ID))
  
  const { data: contact } = await supabase
    .from(`${crmSchema}.contacts`)
    .select('*, company:companies(*)')
    .eq('id', contactId)
    .single()
  
  if (!contact) return { error: 'Contact not found' }
  
  // Upsert client
  const { data: client, error } = await supabase
    .from(`${accSchema}.clients`)
    .upsert({
      site_id: siteId,
      tenant_id: siteId,
      email: contact.email,
      name: contact.company?.name || `${contact.first_name} ${contact.last_name}`.trim(),
      phone: contact.phone,
      crm_contact_id: contact.id,
      crm_company_id: contact.company?.id
    }, { 
      onConflict: 'site_id,email',
      ignoreDuplicates: false 
    })
    .select('id')
    .single()
  
  if (error) return { error: error.message }
  return { clientId: client.id }
}
```

### UI Integration (Deal Won Action)

```tsx
// In deal detail or when moving deal to "Won" stage
import { createInvoiceFromDeal } from '../actions/crm-accounting-integration'

async function handleDealWon(dealId: string) {
  const result = await moveDealToStage(siteId, dealId, wonStageId)
  
  // Prompt user to create invoice
  const createInvoice = await confirm('Create invoice for this deal?')
  
  if (createInvoice) {
    const { invoiceId, error } = await createInvoiceFromDeal(siteId, dealId)
    
    if (invoiceId) {
      toast.success('Invoice created! Redirecting to Accounting...')
      router.push(`/dashboard/sites/${siteId}/modules/accounting/invoices/${invoiceId}`)
    } else {
      toast.error(`Failed to create invoice: ${error}`)
    }
  }
}
```

---

## 📊 Database Schema

### Core Tables

> **⚠️ NAMING CONVENTION**: This CRM uses **schema isolation** per [EM-05](./PHASE-EM-05-MODULE-NAMING-CONVENTIONS.md).
> 
> When this module is deployed, the system will:
> 1. Generate a unique `short_id` from the module's UUID (e.g., `a1b2c3d4`)
> 2. Create schema: `CREATE SCHEMA mod_a1b2c3d4`
> 3. Create tables as: `mod_a1b2c3d4.contacts`, `mod_a1b2c3d4.companies`, etc.
>
> The SQL below shows the **logical table names** - the deployment system prefixes them automatically.

```sql
-- migrations/modules/crm/001_crm_core_tables.sql

-- ======================================
-- CRM MODULE DATABASE SCHEMA
-- ======================================
-- IMPORTANT: This SQL is processed by the Module Schema Manager
-- Table names like "contacts" become "mod_{short_id}.contacts"
-- See: PHASE-EM-05-MODULE-NAMING-CONVENTIONS.md
-- ======================================

-- Variable substitution (set by deployment system)
-- ${SCHEMA} = mod_{short_id} (e.g., mod_a1b2c3d4)

-- Create the module's dedicated schema
CREATE SCHEMA IF NOT EXISTS ${SCHEMA};

-- ----------------------
-- CONTACTS
-- ----------------------
CREATE TABLE ${SCHEMA}.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  site_id UUID NOT NULL,  -- Module installed on this site
  owner_id UUID,          -- User who owns this contact
  
  -- Basic Info
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  job_title TEXT,
  
  -- Company Link
  company_id UUID REFERENCES ${SCHEMA}.companies(id) ON DELETE SET NULL,
  
  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  lead_status TEXT CHECK (lead_status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted')),
  
  -- Source
  source TEXT,  -- 'website', 'referral', 'cold_call', 'event', etc.
  source_details TEXT,
  
  -- Social
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  
  -- Custom Fields (flexible JSON)
  custom_fields JSONB DEFAULT '{}',
  
  -- Tags
  tags TEXT[] DEFAULT '{}',
  
  -- Scoring
  lead_score INTEGER DEFAULT 0,
  
  -- Timestamps
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- COMPANIES / ACCOUNTS
-- ----------------------
CREATE TABLE ${SCHEMA}.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  site_id UUID NOT NULL,
  owner_id UUID,
  
  -- Basic Info
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  
  -- Size
  employee_count INTEGER,
  annual_revenue DECIMAL(15, 2),
  
  -- Address
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  account_type TEXT CHECK (account_type IN ('prospect', 'customer', 'partner', 'competitor', 'other')),
  
  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- DEALS / OPPORTUNITIES
-- ----------------------
CREATE TABLE ${SCHEMA}.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  site_id UUID NOT NULL,
  owner_id UUID,
  
  -- Relations
  contact_id UUID REFERENCES ${SCHEMA}.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES ${SCHEMA}.companies(id) ON DELETE SET NULL,
  
  -- Deal Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pipeline
  pipeline_id UUID REFERENCES ${SCHEMA}.pipelines(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES ${SCHEMA}.pipeline_stages(id) ON DELETE SET NULL,
  
  -- Value
  amount DECIMAL(15, 2),
  currency TEXT DEFAULT 'USD',
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  weighted_value DECIMAL(15, 2) GENERATED ALWAYS AS (amount * probability / 100) STORED,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  close_reason TEXT,  -- Why won or lost
  
  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- PIPELINES
-- ----------------------
CREATE TABLE ${SCHEMA}.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Configuration
  deal_rotting_days INTEGER DEFAULT 30, -- Days before deal is considered "stuck"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- PIPELINE STAGES
-- ----------------------
CREATE TABLE ${SCHEMA}.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES ${SCHEMA}.pipelines(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  
  -- Position and probability
  position INTEGER NOT NULL DEFAULT 0,
  probability INTEGER DEFAULT 50,
  
  -- Type
  stage_type TEXT DEFAULT 'open' CHECK (stage_type IN ('open', 'won', 'lost')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- ACTIVITIES
-- ----------------------
CREATE TABLE ${SCHEMA}.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  -- Activity type
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'task', 'note', 'sms', 'chat'
  )),
  
  -- Relations (at least one required)
  contact_id UUID REFERENCES ${SCHEMA}.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES ${SCHEMA}.companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES ${SCHEMA}.deals(id) ON DELETE CASCADE,
  
  -- Content
  subject TEXT,
  description TEXT,
  outcome TEXT,  -- Result of the activity
  
  -- Call-specific
  call_duration_seconds INTEGER,
  call_direction TEXT CHECK (call_direction IN ('inbound', 'outbound')),
  call_recording_url TEXT,
  
  -- Email-specific
  email_thread_id TEXT,
  email_message_id TEXT,
  
  -- Meeting-specific
  meeting_location TEXT,
  meeting_attendees JSONB DEFAULT '[]',  -- Array of attendee info
  
  -- Task-specific
  task_due_date TIMESTAMPTZ,
  task_completed BOOLEAN DEFAULT FALSE,
  task_priority TEXT CHECK (task_priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Assignment
  assigned_to UUID,
  created_by UUID,
  
  -- Timestamps
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------
-- CUSTOM FIELD DEFINITIONS
-- ----------------------
CREATE TABLE ${SCHEMA}.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  -- What entity this field belongs to
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal', 'activity')),
  
  -- Field definition
  field_key TEXT NOT NULL,  -- Internal key (snake_case)
  field_label TEXT NOT NULL, -- Display label
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text', 'number', 'currency', 'date', 'datetime', 
    'select', 'multiselect', 'checkbox', 'url', 'email', 'phone'
  )),
  
  -- Validation
  is_required BOOLEAN DEFAULT FALSE,
  default_value TEXT,
  placeholder TEXT,
  
  -- For select/multiselect
  options JSONB DEFAULT '[]',  -- [{ value, label, color }]
  
  -- Display
  position INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, entity_type, field_key)
);

-- ----------------------
-- TAGS
-- ----------------------
CREATE TABLE ${SCHEMA}.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(site_id, name)
);

-- ----------------------
-- INDEXES
-- ----------------------
CREATE INDEX idx_crm_contacts_site ON ${SCHEMA}.contacts(site_id);
CREATE INDEX idx_crm_contacts_company ON ${SCHEMA}.contacts(company_id);
CREATE INDEX idx_crm_contacts_email ON ${SCHEMA}.contacts(email);
CREATE INDEX idx_crm_contacts_search ON ${SCHEMA}.contacts USING gin(
  to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, ''))
);

CREATE INDEX idx_crm_companies_site ON ${SCHEMA}.companies(site_id);
CREATE INDEX idx_crm_companies_search ON ${SCHEMA}.companies USING gin(
  to_tsvector('english', coalesce(name, ''))
);

CREATE INDEX idx_crm_deals_site ON ${SCHEMA}.deals(site_id);
CREATE INDEX idx_crm_deals_pipeline ON ${SCHEMA}.deals(pipeline_id);
CREATE INDEX idx_crm_deals_stage ON ${SCHEMA}.deals(stage_id);
CREATE INDEX idx_crm_deals_status ON ${SCHEMA}.deals(status);

CREATE INDEX idx_crm_activities_site ON ${SCHEMA}.activities(site_id);
CREATE INDEX idx_crm_activities_contact ON ${SCHEMA}.activities(contact_id);
CREATE INDEX idx_crm_activities_deal ON ${SCHEMA}.activities(deal_id);
CREATE INDEX idx_crm_activities_type ON ${SCHEMA}.activities(activity_type);
CREATE INDEX idx_crm_activities_scheduled ON ${SCHEMA}.activities(scheduled_at);

-- ----------------------
-- RLS POLICIES
-- ----------------------
ALTER TABLE ${SCHEMA}.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.tags ENABLE ROW LEVEL SECURITY;

-- Contacts: Users can access contacts for sites they have access to
CREATE POLICY "crm_contacts_access" ON ${SCHEMA}.contacts
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM public.sites s
      JOIN public.clients c ON s.client_id = c.id
      JOIN public.agency_members am ON am.agency_id = c.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Similar policies for other tables...
-- (Simplified here for brevity - implement per your RLS patterns)

-- ----------------------
-- TRIGGERS
-- ----------------------
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON ${SCHEMA}.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_companies_updated_at
  BEFORE UPDATE ON ${SCHEMA}.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON ${SCHEMA}.deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON ${SCHEMA}.activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🎨 UI Components

### CRM Main Dashboard

```tsx
// src/modules/crm/components/crm-dashboard.tsx
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContactsView } from './views/contacts-view'
import { CompaniesView } from './views/companies-view'
import { DealsView } from './views/deals-view'
import { ActivitiesView } from './views/activities-view'
import { ReportsView } from './views/reports-view'
import { CRMProvider } from '../context/crm-context'
import { Users, Building2, TrendingUp, Activity, BarChart3 } from 'lucide-react'

interface CRMDashboardProps {
  siteId: string
  settings: Record<string, unknown>
}

export function CRMDashboard({ siteId, settings }: CRMDashboardProps) {
  const [activeTab, setActiveTab] = useState('deals')

  return (
    <CRMProvider siteId={siteId} settings={settings}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h1 className="text-2xl font-bold">CRM Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your contacts, companies, and deals
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="border-b px-6">
            <TabsList className="bg-transparent">
              <TabsTrigger value="deals" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Deals
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-2">
                <Users className="h-4 w-4" />
                Contacts
              </TabsTrigger>
              <TabsTrigger value="companies" className="gap-2">
                <Building2 className="h-4 w-4" />
                Companies
              </TabsTrigger>
              <TabsTrigger value="activities" className="gap-2">
                <Activity className="h-4 w-4" />
                Activities
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="deals" className="flex-1 p-0 m-0">
            <DealsView />
          </TabsContent>
          <TabsContent value="contacts" className="flex-1 p-0 m-0">
            <ContactsView />
          </TabsContent>
          <TabsContent value="companies" className="flex-1 p-0 m-0">
            <CompaniesView />
          </TabsContent>
          <TabsContent value="activities" className="flex-1 p-0 m-0">
            <ActivitiesView />
          </TabsContent>
          <TabsContent value="reports" className="flex-1 p-0 m-0">
            <ReportsView />
          </TabsContent>
        </Tabs>
      </div>
    </CRMProvider>
  )
}
```

### Pipeline/Kanban View

```tsx
// src/modules/crm/components/views/deals-view.tsx
'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Plus, MoreVertical, DollarSign, Calendar, User } from 'lucide-react'
import { useCRM } from '../context/crm-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CreateDealDialog } from '../dialogs/create-deal-dialog'
import { DealDetailSheet } from '../sheets/deal-detail-sheet'

export function DealsView() {
  const { pipelines, stages, deals, moveDeal, isLoading } = useCRM()
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null)

  const activePipeline = pipelines.find(p => p.id === selectedPipeline) || pipelines[0]
  const pipelineStages = stages.filter(s => s.pipeline_id === activePipeline?.id)
    .sort((a, b) => a.position - b.position)

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return
    
    const dealId = result.draggableId
    const newStageId = result.destination.droppableId
    
    await moveDeal(dealId, newStageId)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="h-full flex flex-col">
      {/* Pipeline selector and actions */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {pipelines.map(pipeline => (
            <Button
              key={pipeline.id}
              variant={selectedPipeline === pipeline.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPipeline(pipeline.id)}
            >
              {pipeline.name}
            </Button>
          ))}
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      {/* Pipeline metrics */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b bg-muted/50">
        <MetricCard
          title="Total Deals"
          value={deals.filter(d => d.status === 'open').length.toString()}
        />
        <MetricCard
          title="Pipeline Value"
          value={formatCurrency(
            deals.filter(d => d.status === 'open')
              .reduce((sum, d) => sum + (d.amount || 0), 0)
          )}
        />
        <MetricCard
          title="Weighted Value"
          value={formatCurrency(
            deals.filter(d => d.status === 'open')
              .reduce((sum, d) => sum + (d.weighted_value || 0), 0)
          )}
        />
        <MetricCard
          title="Win Rate"
          value={calculateWinRate(deals) + '%'}
        />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full min-w-max">
            {pipelineStages.map(stage => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                deals={deals.filter(d => d.stage_id === stage.id && d.status === 'open')}
                onDealClick={setSelectedDeal}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Dialogs */}
      <CreateDealDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        pipelineId={activePipeline?.id}
      />
      
      {selectedDeal && (
        <DealDetailSheet
          dealId={selectedDeal}
          open={!!selectedDeal}
          onOpenChange={(open) => !open && setSelectedDeal(null)}
        />
      )}
    </div>
  )
}

function PipelineColumn({ stage, deals, onDealClick }: any) {
  const totalValue = deals.reduce((sum: number, d: any) => sum + (d.amount || 0), 0)

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-muted/30 rounded-lg">
      {/* Column Header */}
      <div 
        className="p-3 border-b rounded-t-lg"
        style={{ borderTopColor: stage.color, borderTopWidth: 3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{stage.name}</span>
            <Badge variant="secondary">{deals.length}</Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(totalValue)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {stage.probability}% probability
        </div>
      </div>

      {/* Deals List */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 space-y-2 overflow-y-auto ${
              snapshot.isDraggingOver ? 'bg-primary/5' : ''
            }`}
          >
            {deals.map((deal: any, index: number) => (
              <Draggable key={deal.id} draggableId={deal.id} index={index}>
                {(provided, snapshot) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      snapshot.isDragging ? 'shadow-lg' : ''
                    }`}
                    onClick={() => onDealClick(deal.id)}
                  >
                    <CardContent className="p-3">
                      <div className="font-medium text-sm mb-2">{deal.name}</div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {deal.amount && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(deal.amount)}
                          </div>
                        )}
                        
                        {deal.expected_close_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(deal.expected_close_date)}
                          </div>
                        )}
                        
                        {deal.contact?.first_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {deal.contact.first_name} {deal.contact.last_name}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-background p-3 rounded-lg border">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function calculateWinRate(deals: any[]): number {
  const closed = deals.filter(d => d.status !== 'open')
  if (closed.length === 0) return 0
  const won = closed.filter(d => d.status === 'won')
  return Math.round((won.length / closed.length) * 100)
}
```

---

## 🔌 API Endpoints

```typescript
// src/modules/crm/api/routes.ts

export const CRM_API_ROUTES = [
  // Contacts
  { path: '/contacts', method: 'GET', handler: 'listContacts', auth_required: true },
  { path: '/contacts', method: 'POST', handler: 'createContact', auth_required: true },
  { path: '/contacts/:id', method: 'GET', handler: 'getContact', auth_required: true },
  { path: '/contacts/:id', method: 'PUT', handler: 'updateContact', auth_required: true },
  { path: '/contacts/:id', method: 'DELETE', handler: 'deleteContact', auth_required: true },
  
  // Companies
  { path: '/companies', method: 'GET', handler: 'listCompanies', auth_required: true },
  { path: '/companies', method: 'POST', handler: 'createCompany', auth_required: true },
  { path: '/companies/:id', method: 'GET', handler: 'getCompany', auth_required: true },
  { path: '/companies/:id', method: 'PUT', handler: 'updateCompany', auth_required: true },
  { path: '/companies/:id', method: 'DELETE', handler: 'deleteCompany', auth_required: true },
  
  // Deals
  { path: '/deals', method: 'GET', handler: 'listDeals', auth_required: true },
  { path: '/deals', method: 'POST', handler: 'createDeal', auth_required: true },
  { path: '/deals/:id', method: 'GET', handler: 'getDeal', auth_required: true },
  { path: '/deals/:id', method: 'PUT', handler: 'updateDeal', auth_required: true },
  { path: '/deals/:id', method: 'DELETE', handler: 'deleteDeal', auth_required: true },
  { path: '/deals/:id/move', method: 'POST', handler: 'moveDeal', auth_required: true },
  
  // Activities
  { path: '/activities', method: 'GET', handler: 'listActivities', auth_required: true },
  { path: '/activities', method: 'POST', handler: 'createActivity', auth_required: true },
  { path: '/activities/:id', method: 'PUT', handler: 'updateActivity', auth_required: true },
  { path: '/activities/:id', method: 'DELETE', handler: 'deleteActivity', auth_required: true },
  
  // Pipelines
  { path: '/pipelines', method: 'GET', handler: 'listPipelines', auth_required: true },
  { path: '/pipelines', method: 'POST', handler: 'createPipeline', auth_required: true },
  { path: '/pipelines/:id', method: 'PUT', handler: 'updatePipeline', auth_required: true },
  { path: '/pipelines/:id/stages', method: 'GET', handler: 'listStages', auth_required: true },
  { path: '/pipelines/:id/stages', method: 'POST', handler: 'createStage', auth_required: true },
  
  // Reports
  { path: '/reports/pipeline', method: 'GET', handler: 'getPipelineReport', auth_required: true },
  { path: '/reports/activity', method: 'GET', handler: 'getActivityReport', auth_required: true },
  { path: '/reports/revenue', method: 'GET', handler: 'getRevenueReport', auth_required: true },
  
  // Search
  { path: '/search', method: 'GET', handler: 'globalSearch', auth_required: true },
  
  // Import/Export
  { path: '/import/contacts', method: 'POST', handler: 'importContacts', auth_required: true },
  { path: '/export/contacts', method: 'GET', handler: 'exportContacts', auth_required: true },
]
```

---

## 📊 Settings Schema

```json
{
  "type": "object",
  "title": "CRM Settings",
  "properties": {
    "branding": {
      "type": "object",
      "title": "Branding",
      "properties": {
        "logo_url": {
          "type": "string",
          "title": "Logo URL"
        },
        "primary_color": {
          "type": "string",
          "title": "Primary Color",
          "default": "#6366f1"
        },
        "company_name": {
          "type": "string",
          "title": "Company Name"
        }
      }
    },
    "currency": {
      "type": "string",
      "title": "Default Currency",
      "default": "USD",
      "enum": ["USD", "EUR", "GBP", "CAD", "AUD"]
    },
    "date_format": {
      "type": "string",
      "title": "Date Format",
      "default": "MM/DD/YYYY",
      "enum": ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]
    },
    "features": {
      "type": "object",
      "title": "Features",
      "properties": {
        "enable_email_integration": {
          "type": "boolean",
          "title": "Enable Email Integration",
          "default": false
        },
        "enable_activity_log": {
          "type": "boolean",
          "title": "Enable Activity Log",
          "default": true
        },
        "enable_reports": {
          "type": "boolean",
          "title": "Enable Reports Dashboard",
          "default": true
        },
        "enable_custom_fields": {
          "type": "boolean",
          "title": "Enable Custom Fields",
          "default": true
        }
      }
    },
    "lead_scoring": {
      "type": "object",
      "title": "Lead Scoring",
      "properties": {
        "enabled": {
          "type": "boolean",
          "title": "Enable Lead Scoring",
          "default": false
        },
        "rules": {
          "type": "array",
          "title": "Scoring Rules",
          "items": {
            "type": "object",
            "properties": {
              "condition": { "type": "string" },
              "points": { "type": "number" }
            }
          }
        }
      }
    }
  }
}
```

---

## 📋 Implementation Tasks

### Phase 1: Core Data Layer (Week 1)
- [ ] Create database schema migration
- [ ] Implement CRM context provider
- [ ] Build data fetching hooks
- [ ] Create server actions for CRUD operations

### Phase 2: UI Components (Week 1-2)
- [ ] Build CRM Dashboard shell
- [ ] Create Contacts list/detail views
- [ ] Create Companies list/detail views
- [ ] Build Pipeline Kanban board
- [ ] Create Activity tracking views
- [ ] Build create/edit dialogs

### Phase 3: Advanced Features (Week 2)
- [ ] Implement global search
- [ ] Build reports dashboard
- [ ] Add import/export functionality
- [ ] Implement custom fields
- [ ] Add email integration hooks

### Phase 4: Module Package (Week 2-3)
- [ ] Create module manifest
- [ ] Package as deployable module
- [ ] Test installation flow
- [ ] Create setup wizard
- [ ] Write documentation

---

## ✅ Verification Checklist

- [ ] CRM installs successfully on a site
- [ ] Contacts CRUD works
- [ ] Companies CRUD works
- [ ] Deals can be created and moved through pipeline
- [ ] Activities are tracked
- [ ] Reports show accurate data
- [ ] Custom fields work
- [ ] Search finds records across entities
- [ ] Import/Export functions
- [ ] White-label branding applies
- [ ] API endpoints work correctly
- [ ] RLS properly isolates data

---

## 🚀 Future Enhancements (Phase 2)

- Email integration (Gmail, Outlook)
- Calendar sync
- Automation workflows
- Lead scoring AI
- Email templates
- Mobile app
- Zapier integration
- Advanced reporting with charts
- Team collaboration features
- Permission management

---

## 🔧 CRM Context Provider

```tsx
// src/modules/crm/context/crm-context.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { 
  getContacts, getCompanies, getDeals, getPipelines, getStages, getActivities,
  createContact, updateContact, deleteContact,
  createCompany, updateCompany, deleteCompany,
  createDeal, updateDeal, deleteDeal, moveDealToStage,
  createActivity, updateActivity, deleteActivity,
  createPipeline, updatePipeline,
  createPipelineStage, updatePipelineStage
} from '../actions/crm-actions'
import type { Contact, Company, Deal, Pipeline, PipelineStage, Activity } from '../types/crm-types'

interface CRMContextType {
  // Data
  contacts: Contact[]
  companies: Company[]
  deals: Deal[]
  pipelines: Pipeline[]
  stages: PipelineStage[]
  activities: Activity[]
  
  // State
  isLoading: boolean
  error: string | null
  
  // Contact actions
  addContact: (data: Partial<Contact>) => Promise<Contact>
  editContact: (id: string, data: Partial<Contact>) => Promise<Contact>
  removeContact: (id: string) => Promise<void>
  
  // Company actions
  addCompany: (data: Partial<Company>) => Promise<Company>
  editCompany: (id: string, data: Partial<Company>) => Promise<Company>
  removeCompany: (id: string) => Promise<void>
  
  // Deal actions
  addDeal: (data: Partial<Deal>) => Promise<Deal>
  editDeal: (id: string, data: Partial<Deal>) => Promise<Deal>
  removeDeal: (id: string) => Promise<void>
  moveDeal: (dealId: string, newStageId: string) => Promise<void>
  
  // Activity actions
  addActivity: (data: Partial<Activity>) => Promise<Activity>
  editActivity: (id: string, data: Partial<Activity>) => Promise<Activity>
  removeActivity: (id: string) => Promise<void>
  
  // Pipeline actions
  addPipeline: (data: Partial<Pipeline>) => Promise<Pipeline>
  editPipeline: (id: string, data: Partial<Pipeline>) => Promise<Pipeline>
  addStage: (pipelineId: string, data: Partial<PipelineStage>) => Promise<PipelineStage>
  editStage: (id: string, data: Partial<PipelineStage>) => Promise<PipelineStage>
  
  // Refresh
  refresh: () => Promise<void>
  
  // Settings
  settings: Record<string, unknown>
}

const CRMContext = createContext<CRMContextType | null>(null)

export function useCRM() {
  const context = useContext(CRMContext)
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider')
  }
  return context
}

interface CRMProviderProps {
  children: ReactNode
  siteId: string
  settings: Record<string, unknown>
}

export function CRMProvider({ children, siteId, settings }: CRMProviderProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [
        contactsData,
        companiesData,
        dealsData,
        pipelinesData,
        stagesData,
        activitiesData
      ] = await Promise.all([
        getContacts(siteId),
        getCompanies(siteId),
        getDeals(siteId),
        getPipelines(siteId),
        getStages(siteId),
        getActivities(siteId)
      ])
      
      setContacts(contactsData)
      setCompanies(companiesData)
      setDeals(dealsData)
      setPipelines(pipelinesData)
      setStages(stagesData)
      setActivities(activitiesData)
    } catch (err: any) {
      setError(err.message || 'Failed to load CRM data')
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Contact actions
  const addContact = async (data: Partial<Contact>) => {
    const contact = await createContact(siteId, data)
    setContacts(prev => [...prev, contact])
    return contact
  }

  const editContact = async (id: string, data: Partial<Contact>) => {
    const contact = await updateContact(siteId, id, data)
    setContacts(prev => prev.map(c => c.id === id ? contact : c))
    return contact
  }

  const removeContact = async (id: string) => {
    await deleteContact(siteId, id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  // Company actions
  const addCompany = async (data: Partial<Company>) => {
    const company = await createCompany(siteId, data)
    setCompanies(prev => [...prev, company])
    return company
  }

  const editCompany = async (id: string, data: Partial<Company>) => {
    const company = await updateCompany(siteId, id, data)
    setCompanies(prev => prev.map(c => c.id === id ? company : c))
    return company
  }

  const removeCompany = async (id: string) => {
    await deleteCompany(siteId, id)
    setCompanies(prev => prev.filter(c => c.id !== id))
  }

  // Deal actions
  const addDeal = async (data: Partial<Deal>) => {
    const deal = await createDeal(siteId, data)
    setDeals(prev => [...prev, deal])
    return deal
  }

  const editDeal = async (id: string, data: Partial<Deal>) => {
    const deal = await updateDeal(siteId, id, data)
    setDeals(prev => prev.map(d => d.id === id ? deal : d))
    return deal
  }

  const removeDeal = async (id: string) => {
    await deleteDeal(siteId, id)
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  const moveDeal = async (dealId: string, newStageId: string) => {
    await moveDealToStage(siteId, dealId, newStageId)
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage_id: newStageId } : d))
  }

  // Activity actions
  const addActivity = async (data: Partial<Activity>) => {
    const activity = await createActivity(siteId, data)
    setActivities(prev => [...prev, activity])
    return activity
  }

  const editActivity = async (id: string, data: Partial<Activity>) => {
    const activity = await updateActivity(siteId, id, data)
    setActivities(prev => prev.map(a => a.id === id ? activity : a))
    return activity
  }

  const removeActivity = async (id: string) => {
    await deleteActivity(siteId, id)
    setActivities(prev => prev.filter(a => a.id !== id))
  }

  // Pipeline actions
  const addPipeline = async (data: Partial<Pipeline>) => {
    const pipeline = await createPipeline(siteId, data)
    setPipelines(prev => [...prev, pipeline])
    return pipeline
  }

  const editPipeline = async (id: string, data: Partial<Pipeline>) => {
    const pipeline = await updatePipeline(siteId, id, data)
    setPipelines(prev => prev.map(p => p.id === id ? pipeline : p))
    return pipeline
  }

  const addStage = async (pipelineId: string, data: Partial<PipelineStage>) => {
    const stage = await createPipelineStage(siteId, pipelineId, data)
    setStages(prev => [...prev, stage])
    return stage
  }

  const editStage = async (id: string, data: Partial<PipelineStage>) => {
    const stage = await updatePipelineStage(siteId, id, data)
    setStages(prev => prev.map(s => s.id === id ? stage : s))
    return stage
  }

  const value: CRMContextType = {
    contacts,
    companies,
    deals,
    pipelines,
    stages,
    activities,
    isLoading,
    error,
    addContact,
    editContact,
    removeContact,
    addCompany,
    editCompany,
    removeCompany,
    addDeal,
    editDeal,
    removeDeal,
    moveDeal,
    addActivity,
    editActivity,
    removeActivity,
    addPipeline,
    editPipeline,
    addStage,
    editStage,
    refresh,
    settings
  }

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  )
}
```

---

## 📡 Server Actions

```typescript
// src/modules/crm/actions/crm-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createModuleDataClient } from '@/lib/modules/database/module-data-access'
import { generateModuleShortId, getModuleSchemaName } from '@/lib/modules/module-naming'
import type { Contact, Company, Deal, Pipeline, PipelineStage, Activity } from '../types/crm-types'

const CRM_MODULE_ID = 'crm-module-uuid' // Set during module installation

function getDataClient(siteId: string) {
  return createModuleDataClient({
    moduleId: CRM_MODULE_ID,
    siteId,
  })
}

// ============================================================================
// CONTACTS
// ============================================================================

export async function getContacts(siteId: string): Promise<Contact[]> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data, error } = await supabase
    .from(`${schema}.contacts`)
    .select(`
      *,
      company:companies(id, name)
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function getContact(siteId: string, id: string): Promise<Contact | null> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data, error } = await supabase
    .from(`${schema}.contacts`)
    .select(`
      *,
      company:companies(id, name),
      activities:activities(*)
    `)
    .eq('site_id', siteId)
    .eq('id', id)
    .single()
  
  if (error) return null
  return data
}

export async function createContact(siteId: string, data: Partial<Contact>): Promise<Contact> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: contact, error } = await supabase
    .from(`${schema}.contacts`)
    .insert({
      site_id: siteId,
      ...data
    })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return contact
}

export async function updateContact(siteId: string, id: string, data: Partial<Contact>): Promise<Contact> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: contact, error } = await supabase
    .from(`${schema}.contacts`)
    .update(data)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return contact
}

export async function deleteContact(siteId: string, id: string): Promise<void> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { error } = await supabase
    .from(`${schema}.contacts`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// COMPANIES
// ============================================================================

export async function getCompanies(siteId: string): Promise<Company[]> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data, error } = await supabase
    .from(`${schema}.companies`)
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function createCompany(siteId: string, data: Partial<Company>): Promise<Company> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: company, error } = await supabase
    .from(`${schema}.companies`)
    .insert({ site_id: siteId, ...data })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return company
}

export async function updateCompany(siteId: string, id: string, data: Partial<Company>): Promise<Company> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: company, error } = await supabase
    .from(`${schema}.companies`)
    .update(data)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return company
}

export async function deleteCompany(siteId: string, id: string): Promise<void> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { error } = await supabase
    .from(`${schema}.companies`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// DEALS
// ============================================================================

export async function getDeals(siteId: string): Promise<Deal[]> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data, error } = await supabase
    .from(`${schema}.deals`)
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email),
      company:companies(id, name),
      stage:pipeline_stages(id, name, color, probability)
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function createDeal(siteId: string, data: Partial<Deal>): Promise<Deal> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: deal, error } = await supabase
    .from(`${schema}.deals`)
    .insert({ site_id: siteId, ...data })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return deal
}

export async function updateDeal(siteId: string, id: string, data: Partial<Deal>): Promise<Deal> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: deal, error } = await supabase
    .from(`${schema}.deals`)
    .update(data)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return deal
}

export async function deleteDeal(siteId: string, id: string): Promise<void> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { error } = await supabase
    .from(`${schema}.deals`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

export async function moveDealToStage(siteId: string, dealId: string, stageId: string): Promise<void> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  // Get stage probability
  const { data: stage } = await supabase
    .from(`${schema}.pipeline_stages`)
    .select('probability, stage_type')
    .eq('id', stageId)
    .single()
  
  const updateData: any = { stage_id: stageId }
  
  if (stage) {
    updateData.probability = stage.probability
    if (stage.stage_type === 'won') {
      updateData.status = 'won'
      updateData.actual_close_date = new Date().toISOString().split('T')[0]
    } else if (stage.stage_type === 'lost') {
      updateData.status = 'lost'
      updateData.actual_close_date = new Date().toISOString().split('T')[0]
    }
  }
  
  const { error } = await supabase
    .from(`${schema}.deals`)
    .update(updateData)
    .eq('site_id', siteId)
    .eq('id', dealId)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// PIPELINES & STAGES
// ============================================================================

export async function getPipelines(siteId: string): Promise<Pipeline[]> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data, error } = await supabase
    .from(`${schema}.pipelines`)
    .select('*')
    .eq('site_id', siteId)
    .eq('is_active', true)
    .order('name')
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function getStages(siteId: string): Promise<PipelineStage[]> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  // Get all pipelines for this site first
  const { data: pipelines } = await supabase
    .from(`${schema}.pipelines`)
    .select('id')
    .eq('site_id', siteId)
  
  if (!pipelines?.length) return []
  
  const pipelineIds = pipelines.map(p => p.id)
  
  const { data, error } = await supabase
    .from(`${schema}.pipeline_stages`)
    .select('*')
    .in('pipeline_id', pipelineIds)
    .order('position')
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function createPipeline(siteId: string, data: Partial<Pipeline>): Promise<Pipeline> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: pipeline, error } = await supabase
    .from(`${schema}.pipelines`)
    .insert({ site_id: siteId, ...data })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  // Create default stages
  const defaultStages = [
    { name: 'Lead', position: 0, probability: 10, stage_type: 'open', color: '#94a3b8' },
    { name: 'Qualified', position: 1, probability: 25, stage_type: 'open', color: '#3b82f6' },
    { name: 'Proposal', position: 2, probability: 50, stage_type: 'open', color: '#8b5cf6' },
    { name: 'Negotiation', position: 3, probability: 75, stage_type: 'open', color: '#f59e0b' },
    { name: 'Won', position: 4, probability: 100, stage_type: 'won', color: '#22c55e' },
    { name: 'Lost', position: 5, probability: 0, stage_type: 'lost', color: '#ef4444' },
  ]
  
  await supabase
    .from(`${schema}.pipeline_stages`)
    .insert(defaultStages.map(s => ({ ...s, pipeline_id: pipeline.id })))
  
  return pipeline
}

export async function updatePipeline(siteId: string, id: string, data: Partial<Pipeline>): Promise<Pipeline> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: pipeline, error } = await supabase
    .from(`${schema}.pipelines`)
    .update(data)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return pipeline
}

export async function createPipelineStage(siteId: string, pipelineId: string, data: Partial<PipelineStage>): Promise<PipelineStage> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: stage, error } = await supabase
    .from(`${schema}.pipeline_stages`)
    .insert({ pipeline_id: pipelineId, ...data })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return stage
}

export async function updatePipelineStage(siteId: string, id: string, data: Partial<PipelineStage>): Promise<PipelineStage> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: stage, error } = await supabase
    .from(`${schema}.pipeline_stages`)
    .update(data)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return stage
}

// ============================================================================
// ACTIVITIES
// ============================================================================

export async function getActivities(siteId: string): Promise<Activity[]> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data, error } = await supabase
    .from(`${schema}.activities`)
    .select(`
      *,
      contact:contacts(id, first_name, last_name),
      deal:deals(id, name)
    `)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function createActivity(siteId: string, data: Partial<Activity>): Promise<Activity> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: activity, error } = await supabase
    .from(`${schema}.activities`)
    .insert({ site_id: siteId, ...data })
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  
  // Update last_contacted_at on contact if applicable
  if (data.contact_id && ['call', 'email', 'meeting'].includes(data.activity_type || '')) {
    await supabase
      .from(`${schema}.contacts`)
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', data.contact_id)
  }
  
  return activity
}

export async function updateActivity(siteId: string, id: string, data: Partial<Activity>): Promise<Activity> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: activity, error } = await supabase
    .from(`${schema}.activities`)
    .update(data)
    .eq('site_id', siteId)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(error.message)
  return activity
}

export async function deleteActivity(siteId: string, id: string): Promise<void> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { error } = await supabase
    .from(`${schema}.activities`)
    .delete()
    .eq('site_id', siteId)
    .eq('id', id)
  
  if (error) throw new Error(error.message)
}

// ============================================================================
// SEARCH & REPORTING
// ============================================================================

export async function globalSearch(siteId: string, query: string): Promise<{
  contacts: Contact[]
  companies: Company[]
  deals: Deal[]
}> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  const searchQuery = `%${query}%`
  
  const [contactsRes, companiesRes, dealsRes] = await Promise.all([
    supabase
      .from(`${schema}.contacts`)
      .select('*')
      .eq('site_id', siteId)
      .or(`first_name.ilike.${searchQuery},last_name.ilike.${searchQuery},email.ilike.${searchQuery}`)
      .limit(10),
    supabase
      .from(`${schema}.companies`)
      .select('*')
      .eq('site_id', siteId)
      .ilike('name', searchQuery)
      .limit(10),
    supabase
      .from(`${schema}.deals`)
      .select('*')
      .eq('site_id', siteId)
      .ilike('name', searchQuery)
      .limit(10)
  ])
  
  return {
    contacts: contactsRes.data || [],
    companies: companiesRes.data || [],
    deals: dealsRes.data || []
  }
}

export async function getPipelineReport(siteId: string, pipelineId: string): Promise<{
  totalDeals: number
  totalValue: number
  weightedValue: number
  byStage: { stage: string; count: number; value: number }[]
  avgDealSize: number
  avgDaysToClose: number
}> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: deals } = await supabase
    .from(`${schema}.deals`)
    .select(`
      *,
      stage:pipeline_stages(name, position)
    `)
    .eq('site_id', siteId)
    .eq('pipeline_id', pipelineId)
  
  if (!deals?.length) {
    return {
      totalDeals: 0,
      totalValue: 0,
      weightedValue: 0,
      byStage: [],
      avgDealSize: 0,
      avgDaysToClose: 0
    }
  }
  
  const openDeals = deals.filter(d => d.status === 'open')
  const wonDeals = deals.filter(d => d.status === 'won')
  
  const byStageMap = new Map<string, { count: number; value: number }>()
  openDeals.forEach(d => {
    const stageName = d.stage?.name || 'Unknown'
    const current = byStageMap.get(stageName) || { count: 0, value: 0 }
    byStageMap.set(stageName, {
      count: current.count + 1,
      value: current.value + (d.amount || 0)
    })
  })
  
  const avgDaysToClose = wonDeals.length > 0
    ? wonDeals.reduce((sum, d) => {
        const created = new Date(d.created_at)
        const closed = new Date(d.actual_close_date || d.created_at)
        return sum + Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      }, 0) / wonDeals.length
    : 0
  
  return {
    totalDeals: openDeals.length,
    totalValue: openDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
    weightedValue: openDeals.reduce((sum, d) => sum + (d.weighted_value || 0), 0),
    byStage: Array.from(byStageMap.entries()).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value
    })),
    avgDealSize: openDeals.length > 0 
      ? openDeals.reduce((sum, d) => sum + (d.amount || 0), 0) / openDeals.length 
      : 0,
    avgDaysToClose: Math.round(avgDaysToClose)
  }
}
```

---

## 📝 TypeScript Types

```typescript
// src/modules/crm/types/crm-types.ts

export interface Contact {
  id: string
  site_id: string
  owner_id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  mobile?: string
  job_title?: string
  company_id?: string
  company?: Company
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  status: 'active' | 'inactive' | 'archived'
  lead_status?: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'
  source?: string
  source_details?: string
  linkedin_url?: string
  twitter_url?: string
  website_url?: string
  custom_fields: Record<string, unknown>
  tags: string[]
  lead_score: number
  last_contacted_at?: string
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  site_id: string
  owner_id?: string
  name: string
  industry?: string
  website?: string
  phone?: string
  employee_count?: number
  annual_revenue?: number
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  status: 'active' | 'inactive' | 'archived'
  account_type?: 'prospect' | 'customer' | 'partner' | 'competitor' | 'other'
  custom_fields: Record<string, unknown>
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  site_id: string
  owner_id?: string
  contact_id?: string
  contact?: Contact
  company_id?: string
  company?: Company
  name: string
  description?: string
  pipeline_id?: string
  stage_id?: string
  stage?: PipelineStage
  amount?: number
  currency: string
  probability: number
  weighted_value?: number
  status: 'open' | 'won' | 'lost'
  close_reason?: string
  expected_close_date?: string
  actual_close_date?: string
  custom_fields: Record<string, unknown>
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Pipeline {
  id: string
  site_id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
  deal_rotting_days: number
  created_at: string
  updated_at: string
}

export interface PipelineStage {
  id: string
  pipeline_id: string
  name: string
  description?: string
  color: string
  position: number
  probability: number
  stage_type: 'open' | 'won' | 'lost'
  created_at: string
}

export interface Activity {
  id: string
  site_id: string
  activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'sms' | 'chat'
  contact_id?: string
  contact?: Contact
  company_id?: string
  deal_id?: string
  deal?: Deal
  subject?: string
  description?: string
  outcome?: string
  call_duration_seconds?: number
  call_direction?: 'inbound' | 'outbound'
  call_recording_url?: string
  email_thread_id?: string
  email_message_id?: string
  meeting_location?: string
  meeting_attendees?: unknown[]
  task_due_date?: string
  task_completed: boolean
  task_priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  created_by?: string
  scheduled_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface CustomField {
  id: string
  site_id: string
  entity_type: 'contact' | 'company' | 'deal' | 'activity'
  field_key: string
  field_label: string
  field_type: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'select' | 'multiselect' | 'checkbox' | 'url' | 'email' | 'phone'
  is_required: boolean
  default_value?: string
  placeholder?: string
  options?: { value: string; label: string; color?: string }[]
  position: number
  is_visible: boolean
  created_at: string
}

export interface Tag {
  id: string
  site_id: string
  name: string
  color: string
  created_at: string
}
```

---

## 📊 Contacts List View Component

```tsx
// src/modules/crm/components/views/contacts-view.tsx
'use client'

import { useState, useMemo } from 'react'
import { useCRM } from '../../context/crm-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, Search, MoreHorizontal, Mail, Phone, Building2, 
  Edit, Trash2, Eye, UserPlus
} from 'lucide-react'
import { CreateContactDialog } from '../dialogs/create-contact-dialog'
import { ContactDetailSheet } from '../sheets/contact-detail-sheet'
import { formatDate } from '@/lib/utils'

export function ContactsView() {
  const { contacts, companies, removeContact, isLoading } = useCRM()
  const [search, setSearch] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter(c => 
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.name?.toLowerCase().includes(q)
    )
  }, [contacts, search])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await removeContact(id)
    }
  }

  const getLeadStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      unqualified: 'bg-red-100 text-red-800',
      converted: 'bg-purple-100 text-purple-800'
    }
    return colors[status || ''] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading contacts...</div>
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredContacts.length} contacts
          </span>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Lead Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow 
                key={contact.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedContact(contact.id)}
              >
                <TableCell>
                  <div className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </div>
                  {contact.job_title && (
                    <div className="text-xs text-muted-foreground">
                      {contact.job_title}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {contact.email && (
                    <a 
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-1 text-sm hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  {contact.phone && (
                    <a 
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-1 text-sm hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  {contact.company && (
                    <div className="flex items-center gap-1 text-sm">
                      <Building2 className="h-3 w-3" />
                      {contact.company.name}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {contact.lead_status && (
                    <Badge className={getLeadStatusColor(contact.lead_status)}>
                      {contact.lead_status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{contact.lead_score}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(contact.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedContact(contact.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(contact.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredContacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {search ? 'No contacts match your search' : 'No contacts yet. Add your first contact!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreateContactDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        companies={companies}
      />

      {selectedContact && (
        <ContactDetailSheet
          contactId={selectedContact}
          open={!!selectedContact}
          onOpenChange={(open) => !open && setSelectedContact(null)}
        />
      )}
    </div>
  )
}
```

---

## 🔄 Module Installation Hook

```typescript
// src/modules/crm/hooks/use-crm-installation.ts

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateModuleShortId, getModuleSchemaName } from '@/lib/modules/module-naming'

const CRM_MODULE_ID = 'crm-module-uuid'

interface CRMInstallationStatus {
  isInstalled: boolean
  isProvisioned: boolean
  needsSetup: boolean
  error?: string
}

export function useCRMInstallation(siteId: string) {
  const [status, setStatus] = useState<CRMInstallationStatus>({
    isInstalled: false,
    isProvisioned: false,
    needsSetup: true
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkInstallation() {
      setIsLoading(true)
      const supabase = createClient()
      
      try {
        // Check if module is installed on site
        const { data: installation } = await supabase
          .from('site_module_installations')
          .select('id, is_enabled, settings')
          .eq('site_id', siteId)
          .eq('module_id', CRM_MODULE_ID)
          .single()

        if (!installation) {
          setStatus({ isInstalled: false, isProvisioned: false, needsSetup: true })
          return
        }

        // Check if database is provisioned
        const shortId = generateModuleShortId(CRM_MODULE_ID)
        const schemaName = getModuleSchemaName(shortId)
        
        const { data: registry } = await supabase
          .from('module_database_registry')
          .select('id')
          .eq('module_short_id', shortId)
          .single()

        // Check if default pipeline exists
        const { data: pipeline } = await supabase
          .from(`${schemaName}.pipelines`)
          .select('id')
          .eq('site_id', siteId)
          .eq('is_default', true)
          .maybeSingle()

        setStatus({
          isInstalled: true,
          isProvisioned: !!registry,
          needsSetup: !pipeline
        })
      } catch (error: any) {
        setStatus({
          isInstalled: false,
          isProvisioned: false,
          needsSetup: true,
          error: error.message
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkInstallation()
  }, [siteId])

  return { status, isLoading }
}
```

---

## 🎯 Pipeline Kanban Board

```tsx
// src/modules/crm/components/views/pipeline-view.tsx
'use client'

import { useState, useMemo, useCallback } from 'react'
import { useCRM } from '../../context/crm-context'
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, DollarSign, Calendar, User, Building2, MoreHorizontal } from 'lucide-react'
import type { Deal, PipelineStage } from '../../types/crm-types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DealCardProps {
  deal: Deal
  onClick: (id: string) => void
}

function DealCard({ deal, onClick }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deal.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card 
        className="mb-2 hover:shadow-md transition-shadow"
        onClick={() => onClick(deal.id)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="font-medium text-sm line-clamp-2">{deal.name}</div>
          
          {deal.amount && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(deal.amount, deal.currency)}
            </div>
          )}
          
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
            {deal.contact && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {deal.contact.first_name} {deal.contact.last_name}
              </div>
            )}
            {deal.company && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {deal.company.name}
              </div>
            )}
          </div>
          
          {deal.expected_close_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Close: {formatDate(deal.expected_close_date)}
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <div 
              className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden"
              title={`${deal.probability}% probability`}
            >
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${deal.probability}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{deal.probability}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface StageColumnProps {
  stage: PipelineStage
  deals: Deal[]
  onDealClick: (id: string) => void
  onAddDeal: (stageId: string) => void
}

function StageColumn({ stage, deals, onDealClick, onAddDeal }: StageColumnProps) {
  const totalValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const weightedValue = deals.reduce((sum, d) => sum + (d.weighted_value || 0), 0)

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px] bg-muted/30 rounded-lg">
      <div 
        className="flex items-center justify-between p-3 border-b"
        style={{ borderLeftColor: stage.color, borderLeftWidth: 4 }}
      >
        <div>
          <div className="font-medium text-sm flex items-center gap-2">
            {stage.name}
            <Badge variant="secondary" className="text-xs">
              {deals.length}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(totalValue)} • {stage.probability}%
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => onAddDeal(stage.id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map(deal => (
            <DealCard key={deal.id} deal={deal} onClick={onDealClick} />
          ))}
        </SortableContext>
        {deals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No deals
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export function PipelineView() {
  const { deals, pipelines, stages, moveDeal, isLoading } = useCRM()
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null)
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [createDealStageId, setCreateDealStageId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 }
    })
  )

  // Get the active pipeline (default if none selected)
  const currentPipeline = useMemo(() => {
    if (!pipelines.length) return null
    if (activePipelineId) {
      return pipelines.find(p => p.id === activePipelineId) || pipelines[0]
    }
    return pipelines.find(p => p.is_default) || pipelines[0]
  }, [pipelines, activePipelineId])

  // Get stages for current pipeline
  const pipelineStages = useMemo(() => {
    if (!currentPipeline) return []
    return stages
      .filter(s => s.pipeline_id === currentPipeline.id)
      .sort((a, b) => a.position - b.position)
  }, [stages, currentPipeline])

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const grouped = new Map<string, Deal[]>()
    pipelineStages.forEach(s => grouped.set(s.id, []))
    
    deals
      .filter(d => d.status === 'open')
      .forEach(deal => {
        const stageId = deal.stage_id
        if (stageId && grouped.has(stageId)) {
          grouped.get(stageId)!.push(deal)
        }
      })
    
    return grouped
  }, [deals, pipelineStages])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const deal = deals.find(d => d.id === active.id)
    if (deal) setDraggedDeal(deal)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedDeal(null)
    
    if (!over) return
    
    // Find which column was dropped on
    const dealId = active.id as string
    const overDealId = over.id as string
    
    // Determine target stage
    let targetStageId: string | null = null
    
    // Check if dropped on a deal
    const overDeal = deals.find(d => d.id === overDealId)
    if (overDeal) {
      targetStageId = overDeal.stage_id || null
    } else {
      // Dropped on stage column itself
      const stage = pipelineStages.find(s => s.id === overDealId)
      if (stage) targetStageId = stage.id
    }
    
    if (targetStageId) {
      const deal = deals.find(d => d.id === dealId)
      if (deal && deal.stage_id !== targetStageId) {
        await moveDeal(dealId, targetStageId)
      }
    }
  }

  // Pipeline summary
  const pipelineSummary = useMemo(() => {
    const openDeals = deals.filter(d => d.status === 'open')
    return {
      totalDeals: openDeals.length,
      totalValue: openDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
      weightedValue: openDeals.reduce((sum, d) => sum + (d.weighted_value || 0), 0)
    }
  }, [deals])

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading pipeline...</div>
  }

  if (!currentPipeline) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">No pipeline found. Create one to get started.</p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Pipeline
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Pipeline Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={currentPipeline.id}
            onChange={(e) => setActivePipelineId(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none"
          >
            {pipelines.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{pipelineSummary.totalDeals} deals</span>
            <span>{formatCurrency(pipelineSummary.totalValue)} total</span>
            <span>{formatCurrency(pipelineSummary.weightedValue)} weighted</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max">
            {pipelineStages.map(stage => (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage.get(stage.id) || []}
                onDealClick={setSelectedDealId}
                onAddDeal={setCreateDealStageId}
              />
            ))}
          </div>

          <DragOverlay>
            {draggedDeal && (
              <Card className="w-[264px] shadow-lg">
                <CardContent className="p-3">
                  <div className="font-medium text-sm">{draggedDeal.name}</div>
                  {draggedDeal.amount && (
                    <div className="text-sm text-green-600">
                      {formatCurrency(draggedDeal.amount, draggedDeal.currency)}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
```

---

## 📧 Email Integration Service

```typescript
// src/modules/crm/services/email-service.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { generateModuleShortId, getModuleSchemaName } from '@/lib/modules/module-naming'
import crypto from 'crypto'

const CRM_MODULE_ID = 'crm-module-uuid'

export interface EmailConfig {
  provider: 'gmail' | 'outlook' | 'smtp'
  credentials: {
    accessToken?: string
    refreshToken?: string
    smtpHost?: string
    smtpPort?: number
    smtpUser?: string
    smtpPassword?: string
  }
}

export interface Email {
  id: string
  threadId?: string
  messageId: string
  from: { email: string; name?: string }
  to: { email: string; name?: string }[]
  cc?: { email: string; name?: string }[]
  bcc?: { email: string; name?: string }[]
  subject: string
  bodyHtml?: string
  bodyText?: string
  date: string
  isRead: boolean
  hasAttachments: boolean
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  id: string
  filename: string
  mimeType: string
  size: number
  url?: string
}

export interface EmailDraft {
  to: { email: string; name?: string }[]
  cc?: { email: string; name?: string }[]
  bcc?: { email: string; name?: string }[]
  subject: string
  bodyHtml: string
  contactId?: string
  dealId?: string
}

// ============================================================================
// EMAIL SYNC
// ============================================================================

export async function syncEmails(siteId: string, userId: string): Promise<{ synced: number; errors: string[] }> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  // Get user's email config
  const { data: config } = await supabase
    .from(`${schema}.email_configs`)
    .select('*')
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .single()
  
  if (!config) {
    return { synced: 0, errors: ['Email not configured'] }
  }
  
  let emails: Email[] = []
  const errors: string[] = []
  
  try {
    if (config.provider === 'gmail') {
      emails = await fetchGmailEmails(config.credentials)
    } else if (config.provider === 'outlook') {
      emails = await fetchOutlookEmails(config.credentials)
    }
  } catch (error: any) {
    errors.push(`Failed to fetch emails: ${error.message}`)
    return { synced: 0, errors }
  }
  
  // Match emails to contacts
  const { data: contacts } = await supabase
    .from(`${schema}.contacts`)
    .select('id, email')
    .eq('site_id', siteId)
    .not('email', 'is', null)
  
  const contactEmailMap = new Map(contacts?.map(c => [c.email!.toLowerCase(), c.id]) || [])
  
  // Store emails and create activities
  let syncedCount = 0
  for (const email of emails) {
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from(`${schema}.email_messages`)
        .select('id')
        .eq('message_id', email.messageId)
        .maybeSingle()
      
      if (existing) continue
      
      // Find matching contact
      const senderEmail = email.from.email.toLowerCase()
      const recipientEmails = email.to.map(t => t.email.toLowerCase())
      const allEmails = [senderEmail, ...recipientEmails]
      const matchedContactId = allEmails.find(e => contactEmailMap.has(e))
        ? contactEmailMap.get(allEmails.find(e => contactEmailMap.has(e))!)
        : null
      
      // Store email
      const { data: stored } = await supabase
        .from(`${schema}.email_messages`)
        .insert({
          site_id: siteId,
          user_id: userId,
          message_id: email.messageId,
          thread_id: email.threadId,
          contact_id: matchedContactId,
          from_address: email.from.email,
          from_name: email.from.name,
          to_addresses: email.to,
          cc_addresses: email.cc,
          subject: email.subject,
          body_html: email.bodyHtml,
          body_text: email.bodyText,
          sent_at: email.date,
          is_read: email.isRead,
          has_attachments: email.hasAttachments
        })
        .select()
        .single()
      
      // Create activity for matched contact
      if (matchedContactId && stored) {
        await supabase
          .from(`${schema}.activities`)
          .insert({
            site_id: siteId,
            activity_type: 'email',
            contact_id: matchedContactId,
            subject: email.subject,
            description: email.bodyText?.substring(0, 500),
            email_thread_id: email.threadId,
            email_message_id: email.messageId,
            created_by: userId
          })
      }
      
      syncedCount++
    } catch (error: any) {
      errors.push(`Failed to sync email ${email.messageId}: ${error.message}`)
    }
  }
  
  return { synced: syncedCount, errors }
}

// ============================================================================
// SEND EMAIL
// ============================================================================

export async function sendEmail(siteId: string, userId: string, draft: EmailDraft): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  // Get user's email config
  const { data: config } = await supabase
    .from(`${schema}.email_configs`)
    .select('*')
    .eq('site_id', siteId)
    .eq('user_id', userId)
    .single()
  
  if (!config) {
    return { success: false, error: 'Email not configured' }
  }
  
  try {
    let messageId: string
    
    if (config.provider === 'gmail') {
      messageId = await sendGmailEmail(config.credentials, draft)
    } else if (config.provider === 'outlook') {
      messageId = await sendOutlookEmail(config.credentials, draft)
    } else {
      messageId = await sendSmtpEmail(config.credentials, draft)
    }
    
    // Log the sent email
    await supabase
      .from(`${schema}.email_messages`)
      .insert({
        site_id: siteId,
        user_id: userId,
        message_id: messageId,
        contact_id: draft.contactId,
        from_address: config.email_address,
        to_addresses: draft.to,
        cc_addresses: draft.cc,
        subject: draft.subject,
        body_html: draft.bodyHtml,
        sent_at: new Date().toISOString(),
        is_outbound: true
      })
    
    // Create activity
    if (draft.contactId) {
      await supabase
        .from(`${schema}.activities`)
        .insert({
          site_id: siteId,
          activity_type: 'email',
          contact_id: draft.contactId,
          deal_id: draft.dealId,
          subject: draft.subject,
          email_message_id: messageId,
          created_by: userId
        })
    }
    
    return { success: true, messageId }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export async function getEmailTemplates(siteId: string) {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data, error } = await supabase
    .from(`${schema}.email_templates`)
    .select('*')
    .eq('site_id', siteId)
    .order('name')
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function applyEmailTemplate(
  templateId: string, 
  contact: { first_name?: string; last_name?: string; email: string; company?: { name: string } },
  deal?: { name: string; amount?: number }
): Promise<{ subject: string; body: string }> {
  const supabase = await createClient()
  const shortId = generateModuleShortId(CRM_MODULE_ID)
  const schema = getModuleSchemaName(shortId)
  
  const { data: template } = await supabase
    .from(`${schema}.email_templates`)
    .select('*')
    .eq('id', templateId)
    .single()
  
  if (!template) throw new Error('Template not found')
  
  // Replace variables
  const variables: Record<string, string> = {
    '{{first_name}}': contact.first_name || '',
    '{{last_name}}': contact.last_name || '',
    '{{full_name}}': `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'there',
    '{{email}}': contact.email,
    '{{company}}': contact.company?.name || '',
    '{{deal_name}}': deal?.name || '',
    '{{deal_amount}}': deal?.amount ? `$${deal.amount.toLocaleString()}` : ''
  }
  
  let subject = template.subject
  let body = template.body_html
  
  Object.entries(variables).forEach(([key, value]) => {
    subject = subject.replaceAll(key, value)
    body = body.replaceAll(key, value)
  })
  
  return { subject, body }
}

// ============================================================================
// PROVIDER IMPLEMENTATIONS (Stubs)
// ============================================================================

async function fetchGmailEmails(credentials: EmailConfig['credentials']): Promise<Email[]> {
  // Implementation using Gmail API
  // const oauth2Client = new google.auth.OAuth2()
  // oauth2Client.setCredentials({ access_token: credentials.accessToken, refresh_token: credentials.refreshToken })
  // const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  // ... fetch emails
  throw new Error('Gmail integration requires setup. Please configure OAuth credentials.')
}

async function fetchOutlookEmails(credentials: EmailConfig['credentials']): Promise<Email[]> {
  // Implementation using Microsoft Graph API
  // const client = Client.init({ authProvider: (done) => done(null, credentials.accessToken) })
  // const messages = await client.api('/me/messages').get()
  // ... fetch emails
  throw new Error('Outlook integration requires setup. Please configure OAuth credentials.')
}

async function sendGmailEmail(credentials: EmailConfig['credentials'], draft: EmailDraft): Promise<string> {
  // Implementation using Gmail API
  throw new Error('Gmail send not implemented')
}

async function sendOutlookEmail(credentials: EmailConfig['credentials'], draft: EmailDraft): Promise<string> {
  // Implementation using Microsoft Graph API
  throw new Error('Outlook send not implemented')
}

async function sendSmtpEmail(credentials: EmailConfig['credentials'], draft: EmailDraft): Promise<string> {
  // Implementation using nodemailer or similar
  // const transporter = nodemailer.createTransport({
  //   host: credentials.smtpHost,
  //   port: credentials.smtpPort,
  //   auth: { user: credentials.smtpUser, pass: credentials.smtpPassword }
  // })
  // const result = await transporter.sendMail({ to, subject, html })
  throw new Error('SMTP send not implemented')
}
```

---

## 📊 Reporting Dashboard Component

```tsx
// src/modules/crm/components/views/reports-view.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCRM } from '../../context/crm-context'
import { getPipelineReport } from '../../actions/crm-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart
} from 'recharts'
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Building2, 
  Target, Calendar, Award
} from 'lucide-react'

interface PipelineMetrics {
  totalDeals: number
  totalValue: number
  weightedValue: number
  byStage: { stage: string; count: number; value: number }[]
  avgDealSize: number
  avgDaysToClose: number
}

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend 
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; isPositive: boolean }
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            {trend && (
              <div className={`flex items-center text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReportsView({ siteId }: { siteId: string }) {
  const { deals, contacts, companies, pipelines, stages, activities } = useCRM()
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [pipelineMetrics, setPipelineMetrics] = useState<PipelineMetrics | null>(null)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  // Select default pipeline
  useEffect(() => {
    if (pipelines.length && !selectedPipelineId) {
      const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0]
      setSelectedPipelineId(defaultPipeline.id)
    }
  }, [pipelines, selectedPipelineId])

  // Fetch pipeline metrics
  useEffect(() => {
    if (selectedPipelineId && siteId) {
      getPipelineReport(siteId, selectedPipelineId).then(setPipelineMetrics)
    }
  }, [selectedPipelineId, siteId])

  // Calculate activity metrics
  const activityMetrics = useMemo(() => {
    const now = new Date()
    const daysAgo = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[dateRange]
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    
    const recentActivities = activities.filter(a => new Date(a.created_at) >= startDate)
    
    const byType: Record<string, number> = {}
    recentActivities.forEach(a => {
      byType[a.activity_type] = (byType[a.activity_type] || 0) + 1
    })
    
    return {
      total: recentActivities.length,
      byType: Object.entries(byType).map(([type, count]) => ({ type, count }))
    }
  }, [activities, dateRange])

  // Deal conversion funnel
  const conversionFunnel = useMemo(() => {
    if (!stages.length || !deals.length) return []
    
    const openStages = stages
      .filter(s => s.stage_type === 'open')
      .sort((a, b) => a.position - b.position)
    
    return openStages.map(stage => {
      const stageDeals = deals.filter(d => d.stage_id === stage.id && d.status === 'open')
      return {
        name: stage.name,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
      }
    })
  }, [deals, stages])

  // Win/Loss stats
  const winLossStats = useMemo(() => {
    const won = deals.filter(d => d.status === 'won')
    const lost = deals.filter(d => d.status === 'lost')
    const total = won.length + lost.length
    
    return {
      won: won.length,
      lost: lost.length,
      wonValue: won.reduce((sum, d) => sum + (d.amount || 0), 0),
      lostValue: lost.reduce((sum, d) => sum + (d.amount || 0), 0),
      winRate: total > 0 ? Math.round((won.length / total) * 100) : 0
    }
  }, [deals])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">CRM Reports</h2>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPipelineId || ''} onValueChange={setSelectedPipelineId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Pipeline Value"
          value={formatCurrency(pipelineMetrics?.totalValue || 0)}
          subtitle={`${pipelineMetrics?.totalDeals || 0} open deals`}
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Weighted Pipeline"
          value={formatCurrency(pipelineMetrics?.weightedValue || 0)}
          subtitle="Based on deal probability"
          icon={Target}
        />
        <MetricCard
          title="Avg Deal Size"
          value={formatCurrency(pipelineMetrics?.avgDealSize || 0)}
          icon={Award}
        />
        <MetricCard
          title="Avg Days to Close"
          value={`${pipelineMetrics?.avgDaysToClose || 0} days`}
          icon={Calendar}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Contacts"
          value={contacts.length}
          icon={Users}
        />
        <MetricCard
          title="Total Companies"
          value={companies.length}
          icon={Building2}
        />
        <MetricCard
          title="Win Rate"
          value={`${winLossStats.winRate}%`}
          subtitle={`${winLossStats.won} won / ${winLossStats.lost} lost`}
          icon={Award}
          trend={{ value: winLossStats.winRate > 50 ? 5 : -5, isPositive: winLossStats.winRate > 50 }}
        />
        <MetricCard
          title="Activities"
          value={activityMetrics.total}
          subtitle={`Last ${dateRange}`}
          icon={Calendar}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="winloss">Win/Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Deals by Stage</CardTitle>
                <CardDescription>Number of deals in each pipeline stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversionFunnel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'count' ? `${value} deals` : formatCurrency(value),
                          name === 'count' ? 'Deals' : 'Value'
                        ]}
                      />
                      <Bar dataKey="count" fill="#3b82f6" name="count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pipeline Value by Stage</CardTitle>
                <CardDescription>Total value of deals in each stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pipelineMetrics?.byStage || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ stage, percent }) => `${stage} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="stage"
                      >
                        {(pipelineMetrics?.byStage || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Breakdown</CardTitle>
              <CardDescription>Types of activities logged in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityMetrics.byType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6">
                      {activityMetrics.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="winloss">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Win/Loss Ratio</CardTitle>
                <CardDescription>Deals won vs lost</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Won', value: winLossStats.won },
                          { name: 'Lost', value: winLossStats.lost }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Won vs Lost Value</CardTitle>
                <CardDescription>Total revenue won vs lost</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Won', value: winLossStats.wonValue, fill: '#22c55e' },
                      { name: 'Lost', value: winLossStats.lostValue, fill: '#ef4444' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value">
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 🔒 Module Permissions & RLS

```sql
-- Module permission policies (applied during installation)
-- Uses EM-11 database provisioning pattern with ${SCHEMA} placeholder

-- Site isolation for all CRM tables
ALTER TABLE ${SCHEMA}.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE ${SCHEMA}.tags ENABLE ROW LEVEL SECURITY;

-- Contacts policies
CREATE POLICY "Users can view contacts for their sites"
  ON ${SCHEMA}.contacts FOR SELECT
  USING (site_id IN (
    SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert contacts for their sites"
  ON ${SCHEMA}.contacts FOR INSERT
  WITH CHECK (site_id IN (
    SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update contacts for their sites"
  ON ${SCHEMA}.contacts FOR UPDATE
  USING (site_id IN (
    SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete contacts for their sites"
  ON ${SCHEMA}.contacts FOR DELETE
  USING (site_id IN (
    SELECT site_id FROM public.site_members 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Companies policies
CREATE POLICY "Users can view companies for their sites"
  ON ${SCHEMA}.companies FOR SELECT
  USING (site_id IN (
    SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage companies for their sites"
  ON ${SCHEMA}.companies FOR ALL
  USING (site_id IN (
    SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
  ));

-- Deals policies
CREATE POLICY "Users can view deals for their sites"
  ON ${SCHEMA}.deals FOR SELECT
  USING (site_id IN (
    SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage deals for their sites"
  ON ${SCHEMA}.deals FOR ALL
  USING (site_id IN (
    SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
  ));

-- Activities policies
CREATE POLICY "Users can view activities for their sites"
  ON ${SCHEMA}.activities FOR SELECT
  USING (site_id IN (
    SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage activities for their sites"
  ON ${SCHEMA}.activities FOR ALL
  USING (site_id IN (
    SELECT site_id FROM public.site_members WHERE user_id = auth.uid()
  ));
```

---

## ✅ Implementation Checklist

| Task | Priority | Status |
|------|----------|--------|
| Create module manifest | 🟢 HIGH | ⬜ |
| Database schema migration | 🟢 HIGH | ⬜ |
| CRM Context Provider | 🟢 HIGH | ⬜ |
| Server Actions (CRUD) | 🟢 HIGH | ⬜ |
| Contacts List View | 🟢 HIGH | ⬜ |
| Contact Detail Sheet | 🟢 HIGH | ⬜ |
| Companies List View | 🟢 HIGH | ⬜ |
| Pipeline Kanban Board | 🟢 HIGH | ⬜ |
| Deal Create/Edit Forms | 🟢 HIGH | ⬜ |
| Activity Timeline | 🟠 MEDIUM | ⬜ |
| Reporting Dashboard | 🟠 MEDIUM | ⬜ |
| Email Service Stubs | 🟠 MEDIUM | ⬜ |
| Email Templates | 🟡 LOW | ⬜ |
| Global Search | 🟡 LOW | ⬜ |
| Custom Fields UI | 🟡 LOW | ⬜ |
| Import/Export CSV | 🟡 LOW | ⬜ |
| RLS Policies | 🟢 HIGH | ⬜ |
| Integration tests | 🟢 HIGH | ⬜ |

---

## 🧪 Testing Requirements

```typescript
// src/modules/crm/__tests__/crm-actions.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  createContact, getContacts, updateContact, deleteContact,
  createCompany, getCompanies,
  createDeal, getDeals, moveDealToStage,
  createPipeline, getPipelines
} from '../actions/crm-actions'

const TEST_SITE_ID = 'test-site-uuid'

describe('CRM Server Actions', () => {
  describe('Contacts', () => {
    let testContactId: string

    it('should create a contact', async () => {
      const contact = await createContact(TEST_SITE_ID, {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      })
      expect(contact).toBeDefined()
      expect(contact.id).toBeDefined()
      expect(contact.first_name).toBe('John')
      testContactId = contact.id
    })

    it('should list contacts', async () => {
      const contacts = await getContacts(TEST_SITE_ID)
      expect(Array.isArray(contacts)).toBe(true)
      expect(contacts.length).toBeGreaterThan(0)
    })

    it('should update a contact', async () => {
      const updated = await updateContact(TEST_SITE_ID, testContactId, {
        job_title: 'CEO'
      })
      expect(updated.job_title).toBe('CEO')
    })

    it('should delete a contact', async () => {
      await deleteContact(TEST_SITE_ID, testContactId)
      const contacts = await getContacts(TEST_SITE_ID)
      expect(contacts.find(c => c.id === testContactId)).toBeUndefined()
    })
  })

  describe('Deals Pipeline', () => {
    let pipelineId: string
    let stageIds: string[]
    let dealId: string

    it('should create a pipeline with default stages', async () => {
      const pipeline = await createPipeline(TEST_SITE_ID, { name: 'Test Pipeline' })
      expect(pipeline).toBeDefined()
      pipelineId = pipeline.id
    })

    it('should move deal between stages', async () => {
      // This would require creating a deal first
      // const deal = await createDeal(TEST_SITE_ID, { name: 'Test Deal', pipeline_id: pipelineId })
      // await moveDealToStage(TEST_SITE_ID, deal.id, stageIds[1])
      // const updated = await getDeals(TEST_SITE_ID)
      // expect(updated.find(d => d.id === deal.id)?.stage_id).toBe(stageIds[1])
    })
  })
})
```

---

**Total Implementation Time Estimate**: 2-3 weeks for full production-ready CRM
