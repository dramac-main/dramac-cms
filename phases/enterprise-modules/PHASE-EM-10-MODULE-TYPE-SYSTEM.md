# Phase EM-10: Enterprise Module Type System

> **Priority**: 🟠 HIGH
> **Estimated Time**: 12-16 hours
> **Prerequisites**: EM-01 (Module Lifecycle Completion), EM-05 (Module Naming Conventions)
> **Status**: 📋 READY TO IMPLEMENT

---

## 🔗 Relationship to Other Phases

**This phase ONLY defines the type system and capabilities schema.**

| Related Phase | Responsibility |
|---------------|----------------|
| **EM-10 (This)** | Defines `ModuleType`, `ModuleCapabilities`, validation logic |
| **EM-11** | Implements database provisioning (uses capabilities from EM-10) |
| **EM-12** | Implements API gateway (uses capabilities from EM-10) |

**DO NOT** duplicate database provisioner code here - that belongs in EM-11.
**DO NOT** duplicate API gateway code here - that belongs in EM-12.

---

## 🎯 Objective

Implement a comprehensive module classification and capability system that supports:

1. **Widgets** - Simple embeddable components
2. **Apps** - Multi-page applications with their own UI
3. **Integrations** - Third-party API connectors
4. **Full Systems** - Complete business management applications
5. **Custom Solutions** - Bespoke client-specific modules

This enables building complex business applications like CRM, E-commerce, Hotel Management, Booking Systems, etc.

---

## 📊 Module Type Specifications

### Type 1: Widget Modules
```yaml
type: widget
complexity: low
development_time: 1-4 hours
characteristics:
  - Single component
  - No dedicated database tables
  - Embeddable anywhere
  - Minimal configuration
examples:
  - Chat bubble
  - Analytics badge
  - Social feed widget
  - Newsletter signup
  - Cookie consent
```

### Type 2: App Modules
```yaml
type: app
complexity: medium
development_time: 1-2 weeks
characteristics:
  - Multiple pages/views
  - Own database tables
  - Settings panel
  - User interactions
  - CRUD operations
examples:
  - Basic CRM
  - Booking calendar
  - Form builder
  - Blog engine
  - Simple e-commerce
```

### Type 3: Integration Modules
```yaml
type: integration
complexity: medium
development_time: 2-5 days
characteristics:
  - API connectivity
  - OAuth/API key auth
  - Data sync
  - Webhook handling
  - External service bridge
examples:
  - Stripe payments
  - Google Analytics
  - Mailchimp
  - Zapier
  - QuickBooks
```

### Type 4: System Modules
```yaml
type: system
complexity: high
development_time: 2-8 weeks
characteristics:
  - Complete application
  - Complex data model
  - Multiple user roles
  - Workflows/automation
  - Reporting/analytics
  - Multi-tenant capable
examples:
  - Hotel Management System
  - Restaurant POS
  - HR/Workforce Management
  - Inventory/ERP
  - Healthcare Practice Mgmt
```

### Type 5: Custom Modules
```yaml
type: custom
complexity: variable
development_time: variable
characteristics:
  - Built for specific client
  - Unique requirements
  - Can become product later
  - Full platform access
examples:
  - Client's unique workflow
  - Industry-specific tools
  - Automation systems
```

---

## � Database Isolation by Module Type

> **IMPORTANT**: See [PHASE-EM-05-MODULE-NAMING-CONVENTIONS.md](./PHASE-EM-05-MODULE-NAMING-CONVENTIONS.md) for full naming specification.

Each module type uses a different database isolation strategy:

| Type | Isolation | Naming Pattern | Example |
|------|-----------|----------------|---------|
| **Widget** | Shared `module_data` | Key: `{module_id}:{key}` | `a1b2c3d4:config` |
| **App** | Prefixed tables | `mod_{short_id}_{table}` | `mod_a1b2c3d4_bookings` |
| **Integration** | Shared `module_data` | Key: `{module_id}:{key}` | `e5f6g7h8:oauth_tokens` |
| **System** | Dedicated schema | `mod_{short_id}.{table}` | `mod_9x8y7z6w.contacts` |
| **Custom** | Dedicated schema | `mod_{short_id}.{table}` | `mod_qr5t6u7v.workflows` |

**Why Schema Isolation for System/Custom modules?**
- Complete namespace isolation
- Easy to drop entire module: `DROP SCHEMA mod_xyz CASCADE`
- Clear ownership of tables
- Easier RLS policy management
- No risk of table name conflicts with other modules

---

## 📋 Implementation Tasks

### Task 1: Database Schema Updates (1 hour)

```sql
-- migrations/20260119000001_module_type_system.sql

-- Add module short ID for database naming (see EM-05)
ALTER TABLE module_source 
ADD COLUMN IF NOT EXISTS short_id TEXT GENERATED ALWAYS AS (
  SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)
) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS idx_module_source_short_id ON module_source(short_id);

-- Add module type and capabilities to module_source
ALTER TABLE module_source 
ADD COLUMN IF NOT EXISTS module_type TEXT DEFAULT 'widget' 
  CHECK (module_type IN ('widget', 'app', 'integration', 'system', 'custom'));

-- Database isolation level (based on type)
ALTER TABLE module_source 
ADD COLUMN IF NOT EXISTS db_isolation TEXT DEFAULT 'none'
  CHECK (db_isolation IN ('none', 'tables', 'schema'));

-- Module capabilities flags
ALTER TABLE module_source 
ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{
  "has_database": false,
  "has_api": false,
  "has_webhooks": false,
  "has_oauth": false,
  "has_multi_page": false,
  "has_roles": false,
  "has_workflows": false,
  "has_reporting": false,
  "embeddable": true,
  "standalone": false,
  "requires_setup": false
}'::jsonb;

-- Module resources (what it creates/uses)
ALTER TABLE module_source 
ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '{
  "tables": [],
  "storage_buckets": [],
  "edge_functions": [],
  "scheduled_jobs": [],
  "webhooks": []
}'::jsonb;

-- Runtime requirements
ALTER TABLE module_source 
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{
  "min_platform_version": "1.0.0",
  "required_permissions": [],
  "required_integrations": [],
  "required_modules": []
}'::jsonb;

-- Add same to modules_v2 for published modules
ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS short_id TEXT;

ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS module_type TEXT DEFAULT 'widget' 
  CHECK (module_type IN ('widget', 'app', 'integration', 'system', 'custom'));

ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS db_isolation TEXT DEFAULT 'none'
  CHECK (db_isolation IN ('none', 'tables', 'schema'));

ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{}'::jsonb;

ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '{}'::jsonb;

ALTER TABLE modules_v2 
ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_module_source_type ON module_source(module_type);
CREATE INDEX IF NOT EXISTS idx_modules_v2_type ON modules_v2(module_type);
```

---

### Task 2: Module Type Definitions (1 hour)

```typescript
// src/lib/modules/types/module-types-v2.ts

export type ModuleType = 'widget' | 'app' | 'integration' | 'system' | 'custom'

export interface ModuleCapabilities {
  // Data capabilities
  has_database: boolean      // Creates its own tables
  has_api: boolean           // Exposes REST/GraphQL endpoints
  has_webhooks: boolean      // Receives external webhooks
  has_oauth: boolean         // Requires OAuth for integrations
  
  // UI capabilities
  has_multi_page: boolean    // Multiple views/pages
  has_roles: boolean         // Role-based access control
  has_workflows: boolean     // Automation/workflow engine
  has_reporting: boolean     // Analytics/reports dashboard
  
  // Deployment capabilities
  embeddable: boolean        // Can embed in websites
  standalone: boolean        // Can run as standalone app
  requires_setup: boolean    // Needs configuration wizard
}

export interface ModuleResources {
  // Database resources
  tables: ModuleTable[]
  
  // Storage
  storage_buckets: string[]
  
  // Serverless
  edge_functions: EdgeFunction[]
  
  // Background jobs
  scheduled_jobs: ScheduledJob[]
  
  // Webhooks
  webhooks: WebhookEndpoint[]
}

export interface ModuleTable {
  name: string
  description: string
  schema: Record<string, ColumnDefinition>
  rls_policies: RLSPolicy[]
  indexes: string[]
  triggers?: string[]
}

export interface ColumnDefinition {
  type: 'uuid' | 'text' | 'integer' | 'decimal' | 'boolean' | 'jsonb' | 'timestamp' | 'date' | 'time'
  nullable: boolean
  default?: string
  references?: { table: string; column: string }
  unique?: boolean
}

export interface RLSPolicy {
  name: string
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'
  using: string
  with_check?: string
}

export interface EdgeFunction {
  name: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  auth_required: boolean
}

export interface ScheduledJob {
  name: string
  schedule: string  // cron expression
  handler: string
  description: string
}

export interface WebhookEndpoint {
  name: string
  path: string
  description: string
  verification_method: 'signature' | 'token' | 'none'
}

export interface ModuleRequirements {
  min_platform_version: string
  required_permissions: string[]
  required_integrations: string[]  // Other modules that must be installed
  required_modules: string[]       // Module dependencies
}

// Module type configurations with defaults
export const MODULE_TYPE_CONFIGS: Record<ModuleType, {
  label: string
  description: string
  icon: string
  defaultCapabilities: Partial<ModuleCapabilities>
  allowedCapabilities: (keyof ModuleCapabilities)[]
}> = {
  widget: {
    label: 'Widget',
    description: 'Simple embeddable component',
    icon: '🧩',
    defaultCapabilities: {
      embeddable: true,
      has_database: false,
      has_api: false,
      standalone: false
    },
    allowedCapabilities: ['embeddable', 'has_api']
  },
  app: {
    label: 'App',
    description: 'Multi-page application',
    icon: '📱',
    defaultCapabilities: {
      embeddable: true,
      standalone: true,
      has_database: true,
      has_api: true,
      has_multi_page: true
    },
    allowedCapabilities: [
      'embeddable', 'standalone', 'has_database', 'has_api', 
      'has_multi_page', 'has_roles', 'requires_setup'
    ]
  },
  integration: {
    label: 'Integration',
    description: 'Third-party service connector',
    icon: '🔗',
    defaultCapabilities: {
      has_api: true,
      has_oauth: true,
      has_webhooks: true,
      requires_setup: true
    },
    allowedCapabilities: [
      'has_api', 'has_oauth', 'has_webhooks', 'has_database', 'requires_setup'
    ]
  },
  system: {
    label: 'Full System',
    description: 'Complete business application',
    icon: '🏢',
    defaultCapabilities: {
      embeddable: true,
      standalone: true,
      has_database: true,
      has_api: true,
      has_multi_page: true,
      has_roles: true,
      has_workflows: true,
      has_reporting: true,
      requires_setup: true
    },
    allowedCapabilities: [
      'embeddable', 'standalone', 'has_database', 'has_api', 
      'has_multi_page', 'has_roles', 'has_workflows', 'has_reporting',
      'has_webhooks', 'has_oauth', 'requires_setup'
    ]
  },
  custom: {
    label: 'Custom Solution',
    description: 'Bespoke client-specific module',
    icon: '⚙️',
    defaultCapabilities: {},
    allowedCapabilities: [
      'embeddable', 'standalone', 'has_database', 'has_api', 
      'has_multi_page', 'has_roles', 'has_workflows', 'has_reporting',
      'has_webhooks', 'has_oauth', 'requires_setup'
    ]
  }
}
```

---

### Task 3: Module Database Provisioner (3 hours)

For modules that need their own database tables, create a provisioning system.

```typescript
// src/lib/modules/database/module-database-provisioner.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth/permissions'
import type { ModuleTable, ModuleResources } from '../types/module-types-v2'

/**
 * Provision database resources for a module
 */
export async function provisionModuleDatabase(
  moduleId: string,
  resources: ModuleResources
): Promise<{ success: boolean; error?: string; tables_created?: string[] }> {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Super admin required' }
  }

  const supabase = await createClient()
  const tablesCreated: string[] = []

  try {
    for (const table of resources.tables) {
      // Generate unique table name with module prefix
      const fullTableName = `mod_${moduleId.replace(/-/g, '_')}_${table.name}`
      
      // Generate CREATE TABLE SQL
      const createSql = generateCreateTableSQL(fullTableName, table)
      
      // Execute via RPC (requires a helper function in Supabase)
      const { error } = await supabase.rpc('execute_ddl', { 
        sql_statement: createSql 
      })
      
      if (error) {
        console.error(`Failed to create table ${fullTableName}:`, error)
        continue
      }

      tablesCreated.push(fullTableName)

      // Create RLS policies
      for (const policy of table.rls_policies) {
        const policySql = generateRLSPolicySQL(fullTableName, policy)
        await supabase.rpc('execute_ddl', { sql_statement: policySql })
      }

      // Create indexes
      for (const indexDef of table.indexes) {
        const indexSql = `CREATE INDEX IF NOT EXISTS idx_${fullTableName}_${indexDef} ON ${fullTableName}(${indexDef})`
        await supabase.rpc('execute_ddl', { sql_statement: indexSql })
      }
    }

    // Update module_source with created resources
    await supabase
      .from('module_source')
      .update({
        resources: {
          ...resources,
          tables: resources.tables.map((t, i) => ({
            ...t,
            actual_name: tablesCreated[i]
          }))
        }
      })
      .eq('id', moduleId)

    return { success: true, tables_created: tablesCreated }

  } catch (error) {
    console.error('[ModuleDB] Provisioning error:', error)
    return { success: false, error: 'Database provisioning failed' }
  }
}

/**
 * Remove database resources when module is deleted
 */
export async function deprovisionModuleDatabase(
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Super admin required' }
  }

  const supabase = await createClient()

  // Get module resources
  const { data: module } = await supabase
    .from('module_source')
    .select('resources')
    .eq('id', moduleId)
    .single()

  if (!module?.resources?.tables) {
    return { success: true } // No tables to remove
  }

  try {
    for (const table of module.resources.tables) {
      const tableName = table.actual_name || `mod_${moduleId.replace(/-/g, '_')}_${table.name}`
      
      // Drop table (CASCADE to remove dependencies)
      await supabase.rpc('execute_ddl', {
        sql_statement: `DROP TABLE IF EXISTS ${tableName} CASCADE`
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[ModuleDB] Deprovisioning error:', error)
    return { success: false, error: 'Database deprovisioning failed' }
  }
}

// Helper functions
function generateCreateTableSQL(tableName: string, table: ModuleTable): string {
  const columns: string[] = [
    'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    'created_at TIMESTAMPTZ DEFAULT NOW()',
    'updated_at TIMESTAMPTZ DEFAULT NOW()'
  ]

  for (const [colName, def] of Object.entries(table.schema)) {
    let colDef = `${colName} ${mapColumnType(def.type)}`
    
    if (!def.nullable) colDef += ' NOT NULL'
    if (def.default) colDef += ` DEFAULT ${def.default}`
    if (def.unique) colDef += ' UNIQUE'
    if (def.references) {
      colDef += ` REFERENCES ${def.references.table}(${def.references.column})`
    }
    
    columns.push(colDef)
  }

  return `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${columns.join(',\n      ')}
    );
    
    ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
    
    CREATE TRIGGER update_${tableName}_updated_at
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `
}

function generateRLSPolicySQL(tableName: string, policy: any): string {
  let sql = `CREATE POLICY "${policy.name}" ON ${tableName} FOR ${policy.action}`
  
  if (policy.using) {
    sql += ` USING (${policy.using})`
  }
  
  if (policy.with_check) {
    sql += ` WITH CHECK (${policy.with_check})`
  }

  return sql
}

function mapColumnType(type: string): string {
  const typeMap: Record<string, string> = {
    uuid: 'UUID',
    text: 'TEXT',
    integer: 'INTEGER',
    decimal: 'DECIMAL(10, 2)',
    boolean: 'BOOLEAN',
    jsonb: 'JSONB',
    timestamp: 'TIMESTAMPTZ',
    date: 'DATE',
    time: 'TIME'
  }
  return typeMap[type] || 'TEXT'
}
```

---

### Task 4: Module API Gateway (3 hours)

Create an API gateway for modules to expose their own endpoints.

```typescript
// src/lib/modules/api/module-api-gateway.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth/permissions'
import { NextRequest } from 'next/server'

export interface ModuleAPIRequest {
  moduleId: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: Record<string, unknown>
  query?: Record<string, string>
  headers?: Record<string, string>
}

export interface ModuleAPIResponse {
  success: boolean
  status: number
  data?: unknown
  error?: string
}

/**
 * Route a request to a module's API
 */
export async function routeModuleAPI(
  request: ModuleAPIRequest
): Promise<ModuleAPIResponse> {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  // 1. Get module configuration
  const { data: module } = await supabase
    .from('modules_v2')
    .select('id, capabilities, resources')
    .eq('id', request.moduleId)
    .eq('is_active', true)
    .single()

  if (!module) {
    return { success: false, status: 404, error: 'Module not found' }
  }

  if (!module.capabilities?.has_api) {
    return { success: false, status: 400, error: 'Module does not support API' }
  }

  // 2. Find matching route
  const routes = module.resources?.edge_functions || []
  const matchedRoute = routes.find(
    (r: any) => r.path === request.path && r.method === request.method
  )

  if (!matchedRoute) {
    return { success: false, status: 404, error: 'Route not found' }
  }

  // 3. Check authentication if required
  if (matchedRoute.auth_required && !userId) {
    return { success: false, status: 401, error: 'Authentication required' }
  }

  // 4. Execute the handler
  try {
    // For edge functions, call Supabase Edge Function
    // For inline handlers, execute in sandboxed environment
    
    if (matchedRoute.handler.startsWith('edge:')) {
      // Call Supabase Edge Function
      const functionName = matchedRoute.handler.replace('edge:', '')
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          moduleId: request.moduleId,
          path: request.path,
          method: request.method,
          body: request.body,
          query: request.query,
          userId
        }
      })

      if (error) {
        return { success: false, status: 500, error: error.message }
      }

      return { success: true, status: 200, data }
    }

    // Inline handler (stored in module code)
    const result = await executeModuleHandler(
      request.moduleId,
      matchedRoute.handler,
      {
        body: request.body,
        query: request.query,
        userId,
        supabase
      }
    )

    return { success: true, status: 200, data: result }

  } catch (error) {
    console.error('[ModuleAPI] Handler error:', error)
    return { 
      success: false, 
      status: 500, 
      error: error instanceof Error ? error.message : 'Handler failed' 
    }
  }
}

/**
 * Execute a module's inline handler
 */
async function executeModuleHandler(
  moduleId: string,
  handlerName: string,
  context: {
    body?: Record<string, unknown>
    query?: Record<string, string>
    userId?: string
    supabase: any
  }
): Promise<unknown> {
  // Get module's API routes configuration
  const { data: module } = await context.supabase
    .from('module_source')
    .select('api_routes')
    .or(`id.eq.${moduleId},module_id.eq.${moduleId}`)
    .single()

  if (!module?.api_routes) {
    throw new Error('Module API routes not found')
  }

  // Find handler code
  const route = module.api_routes.find((r: any) => r.handler === handlerName)
  if (!route?.handlerCode) {
    throw new Error(`Handler ${handlerName} not found`)
  }

  // Execute in sandboxed environment
  // WARNING: In production, use a proper sandbox like isolated-vm
  const handlerFn = new Function(
    'ctx',
    `
    const { body, query, userId, db } = ctx;
    ${route.handlerCode}
    return handler({ body, query, userId, db });
    `
  )

  // Create limited database interface
  const db = createLimitedDBInterface(context.supabase, moduleId)

  return handlerFn({ 
    body: context.body, 
    query: context.query, 
    userId: context.userId, 
    db 
  })
}

/**
 * Create a limited database interface for modules
 * Modules can only access their own tables
 */
function createLimitedDBInterface(supabase: any, moduleId: string) {
  const tablePrefix = `mod_${moduleId.replace(/-/g, '_')}_`
  
  return {
    from: (tableName: string) => {
      // Only allow access to module's own tables
      if (!tableName.startsWith(tablePrefix)) {
        tableName = tablePrefix + tableName
      }
      return supabase.from(tableName)
    },
    
    rpc: (fnName: string, params: any) => {
      // Only allow module-specific RPCs
      const allowedPrefx = `mod_${moduleId.replace(/-/g, '_')}_`
      if (!fnName.startsWith(allowedPrefx)) {
        throw new Error('Access denied to this function')
      }
      return supabase.rpc(fnName, params)
    }
  }
}
```

#### 4.1 Create API Route Handler

```typescript
// src/app/api/modules/[moduleId]/[...path]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { routeModuleAPI } from '@/lib/modules/api/module-api-gateway'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { moduleId, path } = await params
  return handleModuleRequest(request, moduleId, path.join('/'), 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { moduleId, path } = await params
  return handleModuleRequest(request, moduleId, path.join('/'), 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { moduleId, path } = await params
  return handleModuleRequest(request, moduleId, path.join('/'), 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const { moduleId, path } = await params
  return handleModuleRequest(request, moduleId, path.join('/'), 'DELETE')
}

async function handleModuleRequest(
  request: NextRequest,
  moduleId: string,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
) {
  // Parse query params
  const query: Record<string, string> = {}
  request.nextUrl.searchParams.forEach((value, key) => {
    query[key] = value
  })

  // Parse body for non-GET requests
  let body: Record<string, unknown> | undefined
  if (method !== 'GET') {
    try {
      body = await request.json()
    } catch {
      // No body or invalid JSON
    }
  }

  // Route to module API
  const response = await routeModuleAPI({
    moduleId,
    path: '/' + path,
    method,
    body,
    query
  })

  return NextResponse.json(response.data || { error: response.error }, {
    status: response.status
  })
}
```

---

### Task 5: Update Module Studio UI (3 hours)

Add module type selection and capability configuration to the studio.

```tsx
// src/components/admin/modules/module-type-selector.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  MODULE_TYPE_CONFIGS, 
  type ModuleType, 
  type ModuleCapabilities 
} from '@/lib/modules/types/module-types-v2'

interface ModuleTypeSelectorProps {
  selectedType: ModuleType
  capabilities: ModuleCapabilities
  onTypeChange: (type: ModuleType) => void
  onCapabilitiesChange: (capabilities: ModuleCapabilities) => void
}

export function ModuleTypeSelector({
  selectedType,
  capabilities,
  onTypeChange,
  onCapabilitiesChange
}: ModuleTypeSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Type Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Module Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(MODULE_TYPE_CONFIGS).map(([type, config]) => (
            <Card
              key={type}
              className={`cursor-pointer transition-all ${
                selectedType === type 
                  ? 'ring-2 ring-primary border-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => {
                onTypeChange(type as ModuleType)
                // Apply default capabilities for this type
                onCapabilitiesChange({
                  ...getDefaultCapabilities(),
                  ...config.defaultCapabilities
                })
              }}
            >
              <CardHeader className="p-4 pb-2">
                <div className="text-3xl mb-2">{config.icon}</div>
                <CardTitle className="text-base">{config.label}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs">
                  {config.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Capabilities Configuration */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Capabilities</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure what features this module supports
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(CAPABILITY_LABELS).map(([key, label]) => {
            const capKey = key as keyof ModuleCapabilities
            const typeConfig = MODULE_TYPE_CONFIGS[selectedType]
            const isAllowed = typeConfig.allowedCapabilities.includes(capKey)
            const isEnabled = capabilities[capKey]

            return (
              <div 
                key={key}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  !isAllowed ? 'opacity-50' : ''
                }`}
              >
                <div className="flex flex-col">
                  <Label htmlFor={key} className="text-sm font-medium">
                    {label.title}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {label.description}
                  </span>
                </div>
                <Switch
                  id={key}
                  checked={isEnabled}
                  disabled={!isAllowed}
                  onCheckedChange={(checked) => {
                    onCapabilitiesChange({
                      ...capabilities,
                      [capKey]: checked
                    })
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Capability Summary */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Module Configuration Summary</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{MODULE_TYPE_CONFIGS[selectedType].icon} {MODULE_TYPE_CONFIGS[selectedType].label}</Badge>
          {Object.entries(capabilities)
            .filter(([_, enabled]) => enabled)
            .map(([key]) => (
              <Badge key={key} variant="secondary">
                {CAPABILITY_LABELS[key as keyof typeof CAPABILITY_LABELS]?.title || key}
              </Badge>
            ))
          }
        </div>
      </div>
    </div>
  )
}

// Capability labels and descriptions
const CAPABILITY_LABELS: Record<keyof ModuleCapabilities, { title: string; description: string }> = {
  has_database: { 
    title: 'Database', 
    description: 'Creates its own tables' 
  },
  has_api: { 
    title: 'API', 
    description: 'Exposes REST endpoints' 
  },
  has_webhooks: { 
    title: 'Webhooks', 
    description: 'Receives external webhooks' 
  },
  has_oauth: { 
    title: 'OAuth', 
    description: 'Third-party authentication' 
  },
  has_multi_page: { 
    title: 'Multi-Page', 
    description: 'Multiple views/screens' 
  },
  has_roles: { 
    title: 'Roles', 
    description: 'Role-based access' 
  },
  has_workflows: { 
    title: 'Workflows', 
    description: 'Automation engine' 
  },
  has_reporting: { 
    title: 'Reporting', 
    description: 'Analytics dashboard' 
  },
  embeddable: { 
    title: 'Embeddable', 
    description: 'Can embed in websites' 
  },
  standalone: { 
    title: 'Standalone', 
    description: 'Can run as own app' 
  },
  requires_setup: { 
    title: 'Setup Wizard', 
    description: 'Needs configuration' 
  }
}

function getDefaultCapabilities(): ModuleCapabilities {
  return {
    has_database: false,
    has_api: false,
    has_webhooks: false,
    has_oauth: false,
    has_multi_page: false,
    has_roles: false,
    has_workflows: false,
    has_reporting: false,
    embeddable: true,
    standalone: false,
    requires_setup: false
  }
}
```

---

### Task 6: Module Schema Builder UI (3 hours)

For modules with databases, provide a visual schema builder.

```tsx
// src/components/admin/modules/database-schema-builder.tsx
'use client'

import { useState } from 'react'
import { Plus, Trash2, Key, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModuleTable, ColumnDefinition } from '@/lib/modules/types/module-types-v2'

interface DatabaseSchemaBuilderProps {
  tables: ModuleTable[]
  onChange: (tables: ModuleTable[]) => void
}

export function DatabaseSchemaBuilder({ tables, onChange }: DatabaseSchemaBuilderProps) {
  const [expandedTable, setExpandedTable] = useState<string | null>(null)

  const addTable = () => {
    const newTable: ModuleTable = {
      name: `table_${tables.length + 1}`,
      description: '',
      schema: {},
      rls_policies: [],
      indexes: []
    }
    onChange([...tables, newTable])
    setExpandedTable(newTable.name)
  }

  const updateTable = (index: number, updates: Partial<ModuleTable>) => {
    const updated = [...tables]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const removeTable = (index: number) => {
    onChange(tables.filter((_, i) => i !== index))
  }

  const addColumn = (tableIndex: number) => {
    const updated = [...tables]
    updated[tableIndex].schema = {
      ...updated[tableIndex].schema,
      [`column_${Object.keys(updated[tableIndex].schema).length + 1}`]: {
        type: 'text',
        nullable: true
      }
    }
    onChange(updated)
  }

  const updateColumn = (
    tableIndex: number, 
    oldName: string, 
    newName: string, 
    definition: ColumnDefinition
  ) => {
    const updated = [...tables]
    const schema = { ...updated[tableIndex].schema }
    
    if (oldName !== newName) {
      delete schema[oldName]
    }
    schema[newName] = definition
    
    updated[tableIndex].schema = schema
    onChange(updated)
  }

  const removeColumn = (tableIndex: number, columnName: string) => {
    const updated = [...tables]
    const schema = { ...updated[tableIndex].schema }
    delete schema[columnName]
    updated[tableIndex].schema = schema
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Database Schema</h3>
        <Button onClick={addTable} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>

      {tables.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            No database tables defined. Click "Add Table" to create one.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tables.map((table, tableIndex) => (
            <Card key={tableIndex}>
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Input
                    value={table.name}
                    onChange={(e) => updateTable(tableIndex, { name: e.target.value })}
                    className="w-48 font-mono"
                    placeholder="table_name"
                  />
                  <Input
                    value={table.description}
                    onChange={(e) => updateTable(tableIndex, { description: e.target.value })}
                    className="w-64"
                    placeholder="Description..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedTable(
                      expandedTable === table.name ? null : table.name
                    )}
                  >
                    {expandedTable === table.name ? 'Collapse' : 'Expand'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTable(tableIndex)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {expandedTable === table.name && (
                <CardContent className="p-4 pt-0">
                  {/* Auto-generated columns info */}
                  <div className="text-sm text-muted-foreground mb-4 p-2 bg-muted rounded">
                    Auto-included: <code>id (UUID PK)</code>, <code>created_at</code>, <code>updated_at</code>
                  </div>

                  {/* Column definitions */}
                  <div className="space-y-2">
                    {Object.entries(table.schema).map(([colName, colDef]) => (
                      <div key={colName} className="flex items-center gap-2 p-2 border rounded">
                        <Input
                          value={colName}
                          onChange={(e) => updateColumn(tableIndex, colName, e.target.value, colDef)}
                          className="w-32 font-mono"
                          placeholder="column_name"
                        />
                        
                        <Select
                          value={colDef.type}
                          onValueChange={(type) => updateColumn(tableIndex, colName, colName, {
                            ...colDef,
                            type: type as ColumnDefinition['type']
                          })}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="integer">Integer</SelectItem>
                            <SelectItem value="decimal">Decimal</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="jsonb">JSON</SelectItem>
                            <SelectItem value="timestamp">Timestamp</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="uuid">UUID</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1">
                          <Switch
                            checked={!colDef.nullable}
                            onCheckedChange={(required) => updateColumn(tableIndex, colName, colName, {
                              ...colDef,
                              nullable: !required
                            })}
                          />
                          <Label className="text-xs">Required</Label>
                        </div>

                        <div className="flex items-center gap-1">
                          <Switch
                            checked={colDef.unique || false}
                            onCheckedChange={(unique) => updateColumn(tableIndex, colName, colName, {
                              ...colDef,
                              unique
                            })}
                          />
                          <Label className="text-xs">Unique</Label>
                        </div>

                        <Input
                          value={colDef.default || ''}
                          onChange={(e) => updateColumn(tableIndex, colName, colName, {
                            ...colDef,
                            default: e.target.value || undefined
                          })}
                          className="w-32"
                          placeholder="Default value"
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColumn(tableIndex, colName)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addColumn(tableIndex)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>

                  {/* Index configuration */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Indexes</h4>
                    <div className="flex flex-wrap gap-2">
                      {table.indexes.map((idx, idxIndex) => (
                        <div key={idxIndex} className="flex items-center gap-1 px-2 py-1 bg-muted rounded">
                          <code className="text-sm">{idx}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => {
                              const updated = [...tables]
                              updated[tableIndex].indexes = table.indexes.filter((_, i) => i !== idxIndex)
                              onChange(updated)
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                      <Select
                        onValueChange={(col) => {
                          const updated = [...tables]
                          if (!updated[tableIndex].indexes.includes(col)) {
                            updated[tableIndex].indexes.push(col)
                            onChange(updated)
                          }
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Add index..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(table.schema).map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## ✅ Verification Checklist

After implementing all tasks:

- [ ] Module types can be selected in Studio
- [ ] Capabilities toggle based on type
- [ ] Database tables can be defined visually
- [ ] Tables are created when module is deployed
- [ ] Module APIs are accessible via gateway
- [ ] Complex modules (App/System) work with full features
- [ ] Simple widgets still work as before

---

## 📝 Next Phase

After EM-10, proceed to **PHASE-EM-11-DATABASE-PER-MODULE.md** for:
- Multi-tenant data isolation
- Cross-module data access patterns
- Data migration between module versions

