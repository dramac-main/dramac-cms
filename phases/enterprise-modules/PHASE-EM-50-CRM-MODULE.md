# Phase EM-50: CRM Module - Enterprise Ready

> **Priority**: 🟠 HIGH (First Enterprise Module)
> **Estimated Time**: 2-3 weeks
> **Prerequisites**: EM-01, EM-10, EM-11, EM-12
> **Status**: 📋 READY TO IMPLEMENT
> **Module Type**: System

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
CREATE TABLE mod_crm_companies (
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
CREATE TABLE mod_crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  site_id UUID NOT NULL,
  owner_id UUID,
  
  -- Relations
  contact_id UUID REFERENCES mod_crm_contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES mod_crm_companies(id) ON DELETE SET NULL,
  
  -- Deal Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pipeline
  pipeline_id UUID REFERENCES mod_crm_pipelines(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES mod_crm_pipeline_stages(id) ON DELETE SET NULL,
  
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
CREATE TABLE mod_crm_pipelines (
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
CREATE TABLE mod_crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES mod_crm_pipelines(id) ON DELETE CASCADE,
  
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
CREATE TABLE mod_crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL,
  
  -- Activity type
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'call', 'email', 'meeting', 'task', 'note', 'sms', 'chat'
  )),
  
  -- Relations (at least one required)
  contact_id UUID REFERENCES mod_crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES mod_crm_companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES mod_crm_deals(id) ON DELETE CASCADE,
  
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
CREATE TABLE mod_crm_custom_fields (
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
CREATE TABLE mod_crm_tags (
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
CREATE INDEX idx_crm_contacts_site ON mod_crm_contacts(site_id);
CREATE INDEX idx_crm_contacts_company ON mod_crm_contacts(company_id);
CREATE INDEX idx_crm_contacts_email ON mod_crm_contacts(email);
CREATE INDEX idx_crm_contacts_search ON mod_crm_contacts USING gin(
  to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, ''))
);

CREATE INDEX idx_crm_companies_site ON mod_crm_companies(site_id);
CREATE INDEX idx_crm_companies_search ON mod_crm_companies USING gin(
  to_tsvector('english', coalesce(name, ''))
);

CREATE INDEX idx_crm_deals_site ON mod_crm_deals(site_id);
CREATE INDEX idx_crm_deals_pipeline ON mod_crm_deals(pipeline_id);
CREATE INDEX idx_crm_deals_stage ON mod_crm_deals(stage_id);
CREATE INDEX idx_crm_deals_status ON mod_crm_deals(status);

CREATE INDEX idx_crm_activities_site ON mod_crm_activities(site_id);
CREATE INDEX idx_crm_activities_contact ON mod_crm_activities(contact_id);
CREATE INDEX idx_crm_activities_deal ON mod_crm_activities(deal_id);
CREATE INDEX idx_crm_activities_type ON mod_crm_activities(activity_type);
CREATE INDEX idx_crm_activities_scheduled ON mod_crm_activities(scheduled_at);

-- ----------------------
-- RLS POLICIES
-- ----------------------
ALTER TABLE mod_crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crm_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE mod_crm_tags ENABLE ROW LEVEL SECURITY;

-- Contacts: Users can access contacts for sites they have access to
CREATE POLICY "crm_contacts_access" ON mod_crm_contacts
  FOR ALL USING (
    site_id IN (
      SELECT s.id FROM sites s
      JOIN clients c ON s.client_id = c.id
      JOIN agency_members am ON am.agency_id = c.agency_id
      WHERE am.user_id = auth.uid()
    )
  );

-- Similar policies for other tables...
-- (Simplified here for brevity - implement per your RLS patterns)

-- ----------------------
-- TRIGGERS
-- ----------------------
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON mod_crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_companies_updated_at
  BEFORE UPDATE ON mod_crm_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON mod_crm_deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON mod_crm_activities
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

