# Phase EM-40: Multi-Tenant Architecture

> **Priority**: 🔴 CRITICAL
> **Estimated Time**: 12-15 hours
> **Prerequisites**: EM-01, EM-05, EM-11
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Implement **complete data isolation** across all modules ensuring:
1. Agency → Client → Site hierarchy respected
2. Row-Level Security (RLS) enforced everywhere
3. Module data never leaks between tenants
4. Cross-module data access controlled
5. Performance maintained at scale

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AGENCY (Tenant)                         │
│                     agency_id: uuid                         │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Client A  │  │  Client B  │  │  Client C  │            │
│  │ client_id  │  │ client_id  │  │ client_id  │            │
│  ├────────────┤  ├────────────┤  ├────────────┤            │
│  │ ┌────────┐ │  │ ┌────────┐ │  │ ┌────────┐ │            │
│  │ │ Site 1 │ │  │ │ Site 3 │ │  │ │ Site 5 │ │            │
│  │ │site_id │ │  │ │site_id │ │  │ │site_id │ │            │
│  │ └────────┘ │  │ └────────┘ │  │ └────────┘ │            │
│  │ ┌────────┐ │  │ ┌────────┐ │  │            │            │
│  │ │ Site 2 │ │  │ │ Site 4 │ │  │            │            │
│  │ │site_id │ │  │ │site_id │ │  │            │            │
│  │ └────────┘ │  │ └────────┘ │  │            │            │
│  └────────────┘  └────────────┘  └────────────┘            │
├─────────────────────────────────────────────────────────────┤
│                    MODULE DATA                              │
│  Every module table has:                                    │
│  • site_id     → Which site owns this data                 │
│  • agency_id   → Which agency (for billing/admin)          │
│  RLS Policy: site_id = current_setting('app.site_id')      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Core Multi-Tenant Schema (2 hours)

```sql
-- migrations/20260125_multi_tenant_foundation.sql

-- ============================================================================
-- ENSURE BASE TABLES HAVE PROPER STRUCTURE
-- ============================================================================

-- Verify agencies table
ALTER TABLE agencies 
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS max_sites INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';

-- Verify sites table has agency_id
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_id UUID;

-- Create index for agency lookups
CREATE INDEX IF NOT EXISTS idx_sites_agency ON sites(agency_id);
CREATE INDEX IF NOT EXISTS idx_sites_client ON sites(client_id);

-- ============================================================================
-- TENANT CONTEXT FUNCTIONS
-- ============================================================================

-- Set current tenant context (called at start of each request)
CREATE OR REPLACE FUNCTION set_tenant_context(
  p_agency_id UUID,
  p_site_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Set session variables for RLS policies
  PERFORM set_config('app.agency_id', COALESCE(p_agency_id::TEXT, ''), TRUE);
  PERFORM set_config('app.site_id', COALESCE(p_site_id::TEXT, ''), TRUE);
  PERFORM set_config('app.user_id', COALESCE(p_user_id::TEXT, ''), TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current agency ID
CREATE OR REPLACE FUNCTION current_agency_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.agency_id', TRUE), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get current site ID
CREATE OR REPLACE FUNCTION current_site_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.site_id', TRUE), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get current user ID
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('app.user_id', TRUE), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- VERIFY TENANT ACCESS
-- ============================================================================

-- Check if user has access to a site
CREATE OR REPLACE FUNCTION user_has_site_access(p_user_id UUID, p_site_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM agency_users au
    JOIN sites s ON s.agency_id = au.agency_id
    WHERE au.user_id = p_user_id
      AND s.id = p_site_id
      AND au.status = 'active'
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if user is agency admin
CREATE OR REPLACE FUNCTION is_agency_admin(p_user_id UUID, p_agency_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM agency_users
    WHERE user_id = p_user_id
      AND agency_id = p_agency_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  ) INTO v_is_admin;
  
  RETURN v_is_admin;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- TENANT-AWARE MODULE TABLE CREATOR
-- ============================================================================

-- Creates a module table with proper multi-tenant columns and RLS
CREATE OR REPLACE FUNCTION create_module_table(
  p_table_name TEXT,
  p_columns TEXT,  -- Column definitions (name TYPE, ...)
  p_module_id UUID
) RETURNS VOID AS $$
DECLARE
  v_full_table TEXT;
  v_sql TEXT;
BEGIN
  -- Validate table name follows convention
  IF NOT (p_table_name ~ '^mod_[a-f0-9]{8}_[a-z_]+$') THEN
    RAISE EXCEPTION 'Table name must follow pattern: mod_{8char}_{table}';
  END IF;
  
  v_full_table := p_table_name;
  
  -- Create table with multi-tenant columns
  v_sql := format('
    CREATE TABLE IF NOT EXISTS %I (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Multi-tenant columns (REQUIRED)
      site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
      
      -- User tracking
      created_by UUID REFERENCES auth.users(id),
      updated_by UUID REFERENCES auth.users(id),
      
      -- Timestamps
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- Module columns
      %s
    )',
    v_full_table,
    p_columns
  );
  
  EXECUTE v_sql;
  
  -- Create indexes
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_site ON %I(site_id)', v_full_table, v_full_table);
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_agency ON %I(agency_id)', v_full_table, v_full_table);
  
  -- Enable RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', v_full_table);
  
  -- Create RLS policies
  
  -- SELECT: Users can see data for their current site
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR SELECT
    USING (site_id = current_site_id())
  ', 'site_select_' || v_full_table, v_full_table);
  
  -- INSERT: Users can insert for their current site
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR INSERT
    WITH CHECK (
      site_id = current_site_id() 
      AND agency_id = current_agency_id()
    )
  ', 'site_insert_' || v_full_table, v_full_table);
  
  -- UPDATE: Users can update their site's data
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR UPDATE
    USING (site_id = current_site_id())
    WITH CHECK (site_id = current_site_id())
  ', 'site_update_' || v_full_table, v_full_table);
  
  -- DELETE: Users can delete their site's data
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR DELETE
    USING (site_id = current_site_id())
  ', 'site_delete_' || v_full_table, v_full_table);
  
  -- Admin bypass: Agency admins can access all sites in their agency
  EXECUTE format('
    CREATE POLICY %I ON %I
    FOR ALL
    USING (
      agency_id = current_agency_id()
      AND is_agency_admin(current_user_id(), current_agency_id())
    )
  ', 'admin_all_' || v_full_table, v_full_table);
  
  -- Register table in module database registry
  INSERT INTO module_database_registry (module_id, table_name, status)
  VALUES (p_module_id, v_full_table, 'active')
  ON CONFLICT (module_id, table_name) DO UPDATE SET status = 'active';
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Task 2: Tenant Context Middleware (1.5 hours)

```typescript
// src/lib/multi-tenant/tenant-context.ts

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export interface TenantContext {
  agencyId: string;
  siteId?: string;
  userId?: string;
  role?: 'owner' | 'admin' | 'member' | 'viewer';
  permissions?: string[];
}

/**
 * Get current tenant context from session/cookies
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Get site from cookie (set during site selection)
  const cookieStore = await cookies();
  const siteId = cookieStore.get('current_site_id')?.value;
  
  // Get user's agency membership
  const { data: membership } = await supabase
    .from('agency_users')
    .select('agency_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (!membership) return null;
  
  // Verify site belongs to agency
  if (siteId) {
    const { data: site } = await supabase
      .from('sites')
      .select('agency_id')
      .eq('id', siteId)
      .single();
    
    if (!site || site.agency_id !== membership.agency_id) {
      // Site doesn't belong to user's agency
      return {
        agencyId: membership.agency_id,
        userId: user.id,
        role: membership.role
      };
    }
  }
  
  return {
    agencyId: membership.agency_id,
    siteId: siteId || undefined,
    userId: user.id,
    role: membership.role
  };
}

/**
 * Set tenant context in database session
 */
export async function setDatabaseContext(context: TenantContext): Promise<void> {
  const supabase = createAdminClient();
  
  await supabase.rpc('set_tenant_context', {
    p_agency_id: context.agencyId,
    p_site_id: context.siteId || null,
    p_user_id: context.userId || null
  });
}

/**
 * Create a tenant-scoped Supabase client
 */
export async function createTenantClient() {
  const context = await getTenantContext();
  if (!context) {
    throw new Error('No tenant context available');
  }
  
  const supabase = createAdminClient();
  
  // Set context before returning
  await setDatabaseContext(context);
  
  return {
    ...supabase,
    context
  };
}
```

---

### Task 3: Tenant-Aware API Middleware (1.5 hours)

```typescript
// src/middleware/tenant-middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Middleware to inject tenant context into API requests
 */
export async function tenantMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Skip non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return response;
  }
  
  // Skip public routes
  const publicRoutes = ['/api/auth', '/api/public', '/api/webhook'];
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return response;
  }
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get site ID from various sources
    const siteId = 
      request.headers.get('x-site-id') ||
      request.nextUrl.searchParams.get('site_id') ||
      request.cookies.get('current_site_id')?.value;
    
    // Get user's agency
    const { data: membership } = await supabase
      .from('agency_users')
      .select('agency_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (!membership) {
      return NextResponse.json(
        { error: 'No agency membership found' },
        { status: 403 }
      );
    }
    
    // If site specified, verify access
    if (siteId) {
      const { data: site } = await supabase
        .from('sites')
        .select('agency_id')
        .eq('id', siteId)
        .single();
      
      if (!site || site.agency_id !== membership.agency_id) {
        return NextResponse.json(
          { error: 'Access denied to this site' },
          { status: 403 }
        );
      }
    }
    
    // Add context to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-agency-id', membership.agency_id);
    requestHeaders.set('x-tenant-user-id', user.id);
    requestHeaders.set('x-tenant-role', membership.role);
    if (siteId) {
      requestHeaders.set('x-tenant-site-id', siteId);
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
    
  } catch (error) {
    console.error('Tenant middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract tenant context from request headers (in API routes)
 */
export function getTenantFromRequest(request: NextRequest) {
  return {
    agencyId: request.headers.get('x-tenant-agency-id'),
    siteId: request.headers.get('x-tenant-site-id'),
    userId: request.headers.get('x-tenant-user-id'),
    role: request.headers.get('x-tenant-role')
  };
}
```

---

### Task 4: Module Data Access Layer (2 hours)

```typescript
// src/lib/modules/database/tenant-data-access.ts

import { createAdminClient } from '@/lib/supabase/admin';
import { TenantContext } from '@/lib/multi-tenant/tenant-context';

export interface ModuleDataOptions {
  moduleId: string;
  tablePrefix: string;
  context: TenantContext;
}

/**
 * Create a tenant-isolated data access client for modules
 */
export function createModuleDataAccess(options: ModuleDataOptions) {
  const { moduleId, tablePrefix, context } = options;
  
  if (!context.siteId) {
    throw new Error('Site context required for module data access');
  }
  
  const supabase = createAdminClient();
  
  // Set tenant context
  supabase.rpc('set_tenant_context', {
    p_agency_id: context.agencyId,
    p_site_id: context.siteId,
    p_user_id: context.userId
  });
  
  return {
    /**
     * Query a module table (automatically filtered by tenant)
     */
    from(tableName: string) {
      const fullTableName = `${tablePrefix}_${tableName}`;
      
      return {
        /**
         * Select with automatic tenant filtering
         */
        async select(columns = '*') {
          const { data, error } = await supabase
            .from(fullTableName)
            .select(columns)
            .eq('site_id', context.siteId!);
          
          if (error) throw error;
          return data;
        },
        
        /**
         * Select single record
         */
        async get(id: string) {
          const { data, error } = await supabase
            .from(fullTableName)
            .select('*')
            .eq('id', id)
            .eq('site_id', context.siteId!)
            .single();
          
          if (error) throw error;
          return data;
        },
        
        /**
         * Insert with automatic tenant context
         */
        async insert(data: any | any[]) {
          const records = Array.isArray(data) ? data : [data];
          
          const withTenant = records.map(record => ({
            ...record,
            site_id: context.siteId,
            agency_id: context.agencyId,
            created_by: context.userId
          }));
          
          const { data: result, error } = await supabase
            .from(fullTableName)
            .insert(withTenant)
            .select();
          
          if (error) throw error;
          return Array.isArray(data) ? result : result?.[0];
        },
        
        /**
         * Update with tenant verification
         */
        async update(id: string, updates: any) {
          const { data: result, error } = await supabase
            .from(fullTableName)
            .update({
              ...updates,
              updated_by: context.userId,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('site_id', context.siteId!)
            .select()
            .single();
          
          if (error) throw error;
          return result;
        },
        
        /**
         * Delete with tenant verification
         */
        async delete(id: string) {
          const { error } = await supabase
            .from(fullTableName)
            .delete()
            .eq('id', id)
            .eq('site_id', context.siteId!);
          
          if (error) throw error;
          return { success: true };
        },
        
        /**
         * Count records
         */
        async count(filters?: Record<string, any>) {
          let query = supabase
            .from(fullTableName)
            .select('id', { count: 'exact', head: true })
            .eq('site_id', context.siteId!);
          
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          
          const { count, error } = await query;
          if (error) throw error;
          return count || 0;
        },
        
        /**
         * Query builder for complex queries
         */
        query() {
          return supabase
            .from(fullTableName)
            .select('*')
            .eq('site_id', context.siteId!);
        }
      };
    },
    
    /**
     * Cross-table query within same module
     */
    async join(
      mainTable: string,
      joinTable: string,
      joinColumn: string,
      columns = '*'
    ) {
      const mainFullName = `${tablePrefix}_${mainTable}`;
      const joinFullName = `${tablePrefix}_${joinTable}`;
      
      const { data, error } = await supabase
        .from(mainFullName)
        .select(`${columns}, ${joinTable}:${joinFullName}(*)`)
        .eq('site_id', context.siteId!);
      
      if (error) throw error;
      return data;
    },
    
    /**
     * Aggregate data (for dashboards)
     */
    async aggregate(tableName: string, aggregations: {
      count?: boolean;
      sum?: string[];
      avg?: string[];
      groupBy?: string;
    }) {
      const fullTableName = `${tablePrefix}_${tableName}`;
      
      // Build select clause
      const selects: string[] = [];
      if (aggregations.count) selects.push('count()');
      if (aggregations.sum) {
        aggregations.sum.forEach(col => selects.push(`sum(${col})`));
      }
      if (aggregations.avg) {
        aggregations.avg.forEach(col => selects.push(`avg(${col})`));
      }
      if (aggregations.groupBy) {
        selects.push(aggregations.groupBy);
      }
      
      const query = supabase
        .from(fullTableName)
        .select(selects.join(','))
        .eq('site_id', context.siteId!);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    
    /**
     * Get module context
     */
    getContext() {
      return context;
    }
  };
}
```

---

### Task 5: Agency-Level Data Access (1 hour)

```typescript
// src/lib/modules/database/agency-data-access.ts

import { createAdminClient } from '@/lib/supabase/admin';
import { TenantContext } from '@/lib/multi-tenant/tenant-context';

/**
 * Agency-level data access (for admins to see all sites)
 */
export function createAgencyDataAccess(
  tablePrefix: string,
  context: TenantContext
) {
  if (context.role !== 'owner' && context.role !== 'admin') {
    throw new Error('Agency-level access requires admin role');
  }
  
  const supabase = createAdminClient();
  
  return {
    /**
     * Query across all sites in agency
     */
    from(tableName: string) {
      const fullTableName = `${tablePrefix}_${tableName}`;
      
      return {
        /**
         * Get data from all sites
         */
        async selectAll(columns = '*') {
          const { data, error } = await supabase
            .from(fullTableName)
            .select(columns)
            .eq('agency_id', context.agencyId);
          
          if (error) throw error;
          return data;
        },
        
        /**
         * Get data grouped by site
         */
        async selectBySite(columns = '*') {
          const { data, error } = await supabase
            .from(fullTableName)
            .select(`${columns}, site:sites(id, name)`)
            .eq('agency_id', context.agencyId);
          
          if (error) throw error;
          
          // Group by site
          const grouped: Record<string, any[]> = {};
          data?.forEach(record => {
            const siteId = record.site_id;
            if (!grouped[siteId]) grouped[siteId] = [];
            grouped[siteId].push(record);
          });
          
          return grouped;
        },
        
        /**
         * Get aggregate stats per site
         */
        async statsPerSite() {
          const { data, error } = await supabase
            .from(fullTableName)
            .select('site_id, count()')
            .eq('agency_id', context.agencyId);
          
          if (error) throw error;
          return data;
        }
      };
    },
    
    /**
     * Get all sites in agency
     */
    async getSites() {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, domain, created_at')
        .eq('agency_id', context.agencyId);
      
      if (error) throw error;
      return data;
    },
    
    /**
     * Get agency-wide module statistics
     */
    async getModuleStats(tableName: string) {
      const fullTableName = `${tablePrefix}_${tableName}`;
      
      const { data, error } = await supabase
        .from(fullTableName)
        .select(`
          site_id,
          sites:site_id(name),
          count()
        `)
        .eq('agency_id', context.agencyId);
      
      if (error) throw error;
      return data;
    }
  };
}
```

---

### Task 6: Cross-Module Data Access (1.5 hours)

```typescript
// src/lib/modules/database/cross-module-access.ts

import { createAdminClient } from '@/lib/supabase/admin';
import { TenantContext } from '@/lib/multi-tenant/tenant-context';

export interface CrossModulePermission {
  sourceModule: string;
  targetModule: string;
  allowedTables: string[];
  allowedOperations: ('read' | 'write')[];
}

// Registry of allowed cross-module access
const CROSS_MODULE_PERMISSIONS: CrossModulePermission[] = [
  // CRM can read from Booking for customer appointments
  {
    sourceModule: 'crm',
    targetModule: 'booking',
    allowedTables: ['appointments', 'calendars'],
    allowedOperations: ['read']
  },
  // Booking can read CRM contacts
  {
    sourceModule: 'booking',
    targetModule: 'crm',
    allowedTables: ['contacts', 'companies'],
    allowedOperations: ['read']
  },
  // E-commerce can read CRM for customer data
  {
    sourceModule: 'ecommerce',
    targetModule: 'crm',
    allowedTables: ['contacts'],
    allowedOperations: ['read']
  },
  // Analytics can read from all modules
  {
    sourceModule: 'analytics',
    targetModule: '*',
    allowedTables: ['*'],
    allowedOperations: ['read']
  }
];

/**
 * Create cross-module data accessor
 */
export function createCrossModuleAccess(
  sourceModule: string,
  context: TenantContext
) {
  const supabase = createAdminClient();
  
  return {
    /**
     * Read from another module's table
     */
    async readFrom(
      targetModule: string,
      tableName: string,
      options?: {
        select?: string;
        filters?: Record<string, any>;
        limit?: number;
      }
    ) {
      // Check permission
      const permission = CROSS_MODULE_PERMISSIONS.find(p =>
        p.sourceModule === sourceModule &&
        (p.targetModule === targetModule || p.targetModule === '*') &&
        (p.allowedTables.includes(tableName) || p.allowedTables.includes('*')) &&
        p.allowedOperations.includes('read')
      );
      
      if (!permission) {
        throw new Error(
          `Cross-module access denied: ${sourceModule} cannot read ${targetModule}.${tableName}`
        );
      }
      
      // Get target module's table prefix
      const { data: targetModuleData } = await supabase
        .from('module_database_registry')
        .select('table_name')
        .ilike('table_name', `mod_%_${tableName}`)
        .single();
      
      if (!targetModuleData) {
        throw new Error(`Table ${tableName} not found in ${targetModule}`);
      }
      
      const fullTableName = targetModuleData.table_name;
      
      // Query with tenant isolation
      let query = supabase
        .from(fullTableName)
        .select(options?.select || '*')
        .eq('site_id', context.siteId!);
      
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Log cross-module access for audit
      await logCrossModuleAccess(
        sourceModule,
        targetModule,
        tableName,
        'read',
        context
      );
      
      return data;
    },
    
    /**
     * Write to another module's table (if permitted)
     */
    async writeTo(
      targetModule: string,
      tableName: string,
      operation: 'insert' | 'update' | 'delete',
      data: any,
      id?: string
    ) {
      // Check permission
      const permission = CROSS_MODULE_PERMISSIONS.find(p =>
        p.sourceModule === sourceModule &&
        (p.targetModule === targetModule || p.targetModule === '*') &&
        (p.allowedTables.includes(tableName) || p.allowedTables.includes('*')) &&
        p.allowedOperations.includes('write')
      );
      
      if (!permission) {
        throw new Error(
          `Cross-module write denied: ${sourceModule} cannot write to ${targetModule}.${tableName}`
        );
      }
      
      // Get table name
      const { data: targetModuleData } = await supabase
        .from('module_database_registry')
        .select('table_name')
        .ilike('table_name', `mod_%_${tableName}`)
        .single();
      
      if (!targetModuleData) {
        throw new Error(`Table ${tableName} not found in ${targetModule}`);
      }
      
      const fullTableName = targetModuleData.table_name;
      
      let result;
      
      switch (operation) {
        case 'insert':
          const insertData = {
            ...data,
            site_id: context.siteId,
            agency_id: context.agencyId,
            created_by: context.userId
          };
          result = await supabase.from(fullTableName).insert(insertData).select();
          break;
          
        case 'update':
          if (!id) throw new Error('ID required for update');
          result = await supabase
            .from(fullTableName)
            .update({ ...data, updated_by: context.userId })
            .eq('id', id)
            .eq('site_id', context.siteId!)
            .select();
          break;
          
        case 'delete':
          if (!id) throw new Error('ID required for delete');
          result = await supabase
            .from(fullTableName)
            .delete()
            .eq('id', id)
            .eq('site_id', context.siteId!);
          break;
      }
      
      // Log access
      await logCrossModuleAccess(
        sourceModule,
        targetModule,
        tableName,
        'write',
        context
      );
      
      return result;
    }
  };
}

async function logCrossModuleAccess(
  sourceModule: string,
  targetModule: string,
  tableName: string,
  operation: string,
  context: TenantContext
) {
  const supabase = createAdminClient();
  
  await supabase.from('module_access_logs').insert({
    source_module: sourceModule,
    target_module: targetModule,
    table_name: tableName,
    operation,
    site_id: context.siteId,
    agency_id: context.agencyId,
    user_id: context.userId
  }).catch(() => {}); // Don't fail on logging error
}
```

---

### Task 7: Data Export/Import with Tenant Isolation (1.5 hours)

```typescript
// src/lib/modules/database/tenant-data-export.ts

import { createAdminClient } from '@/lib/supabase/admin';
import { TenantContext } from '@/lib/multi-tenant/tenant-context';

/**
 * Export module data for a specific tenant
 */
export async function exportModuleData(
  moduleId: string,
  tablePrefix: string,
  context: TenantContext
): Promise<Record<string, any[]>> {
  const supabase = createAdminClient();
  
  // Get all tables for this module
  const { data: tables } = await supabase
    .from('module_database_registry')
    .select('table_name')
    .eq('module_id', moduleId)
    .eq('status', 'active');
  
  if (!tables?.length) {
    return {};
  }
  
  const exportData: Record<string, any[]> = {};
  
  for (const { table_name } of tables) {
    const { data } = await supabase
      .from(table_name)
      .select('*')
      .eq('site_id', context.siteId!);
    
    // Remove sensitive fields
    const cleanedData = (data || []).map(record => {
      const { site_id, agency_id, created_by, updated_by, ...rest } = record;
      return rest;
    });
    
    // Extract short table name
    const shortName = table_name.replace(`${tablePrefix}_`, '');
    exportData[shortName] = cleanedData;
  }
  
  return exportData;
}

/**
 * Import module data into a tenant
 */
export async function importModuleData(
  moduleId: string,
  tablePrefix: string,
  context: TenantContext,
  data: Record<string, any[]>,
  options?: {
    mergeStrategy: 'replace' | 'merge' | 'skip';
    preserveIds?: boolean;
  }
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const supabase = createAdminClient();
  const strategy = options?.mergeStrategy || 'merge';
  
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  for (const [tableName, records] of Object.entries(data)) {
    const fullTableName = `${tablePrefix}_${tableName}`;
    
    try {
      // Clear existing data if replacing
      if (strategy === 'replace') {
        await supabase
          .from(fullTableName)
          .delete()
          .eq('site_id', context.siteId!);
      }
      
      for (const record of records) {
        try {
          // Add tenant context
          const recordWithTenant = {
            ...record,
            site_id: context.siteId,
            agency_id: context.agencyId,
            created_by: context.userId
          };
          
          // Remove ID if not preserving
          if (!options?.preserveIds) {
            delete recordWithTenant.id;
          }
          
          if (strategy === 'skip' && record.id) {
            // Check if exists
            const { data: existing } = await supabase
              .from(fullTableName)
              .select('id')
              .eq('id', record.id)
              .eq('site_id', context.siteId!)
              .single();
            
            if (existing) {
              skipped++;
              continue;
            }
          }
          
          if (strategy === 'merge' && record.id) {
            // Upsert
            await supabase
              .from(fullTableName)
              .upsert(recordWithTenant);
          } else {
            // Insert
            await supabase
              .from(fullTableName)
              .insert(recordWithTenant);
          }
          
          imported++;
          
        } catch (recordError: any) {
          errors.push(`${tableName}: ${recordError.message}`);
        }
      }
      
    } catch (tableError: any) {
      errors.push(`Table ${tableName}: ${tableError.message}`);
    }
  }
  
  return { imported, skipped, errors };
}

/**
 * Clone module data between sites (same agency)
 */
export async function cloneModuleData(
  moduleId: string,
  tablePrefix: string,
  sourceSiteId: string,
  targetSiteId: string,
  agencyId: string,
  userId: string
): Promise<{ cloned: number; errors: string[] }> {
  // Export from source
  const exportedData = await exportModuleData(moduleId, tablePrefix, {
    agencyId,
    siteId: sourceSiteId,
    userId
  });
  
  // Import to target
  const result = await importModuleData(
    moduleId,
    tablePrefix,
    {
      agencyId,
      siteId: targetSiteId,
      userId
    },
    exportedData,
    { mergeStrategy: 'replace', preserveIds: false }
  );
  
  return {
    cloned: result.imported,
    errors: result.errors
  };
}
```

---

### Task 8: React Hooks for Tenant Context (1 hour)

```typescript
// src/lib/multi-tenant/hooks.ts

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TenantContextValue {
  agencyId: string | null;
  siteId: string | null;
  userId: string | null;
  role: string | null;
  isLoading: boolean;
  sites: Array<{ id: string; name: string }>;
  switchSite: (siteId: string) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  
  useEffect(() => {
    const supabase = createClient();
    
    async function loadTenantContext() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }
        
        setUserId(user.id);
        
        // Get agency membership
        const { data: membership } = await supabase
          .from('agency_users')
          .select('agency_id, role')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        
        if (membership) {
          setAgencyId(membership.agency_id);
          setRole(membership.role);
          
          // Get available sites
          const { data: siteList } = await supabase
            .from('sites')
            .select('id, name')
            .eq('agency_id', membership.agency_id);
          
          setSites(siteList || []);
          
          // Get current site from cookie or use first site
          const currentSiteId = document.cookie
            .split('; ')
            .find(row => row.startsWith('current_site_id='))
            ?.split('=')[1];
          
          if (currentSiteId && siteList?.some(s => s.id === currentSiteId)) {
            setSiteId(currentSiteId);
          } else if (siteList?.length) {
            setSiteId(siteList[0].id);
            document.cookie = `current_site_id=${siteList[0].id}; path=/`;
          }
        }
        
      } catch (error) {
        console.error('Failed to load tenant context:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadTenantContext();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadTenantContext();
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  function switchSite(newSiteId: string) {
    if (sites.some(s => s.id === newSiteId)) {
      setSiteId(newSiteId);
      document.cookie = `current_site_id=${newSiteId}; path=/`;
      
      // Trigger refresh of dependent data
      window.dispatchEvent(new CustomEvent('tenant-site-changed', {
        detail: { siteId: newSiteId }
      }));
    }
  }
  
  return (
    <TenantContext.Provider value={{
      agencyId,
      siteId,
      userId,
      role,
      isLoading,
      sites,
      switchSite
    }}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Hook to ensure site is selected before rendering
 */
export function useRequireSite() {
  const tenant = useTenant();
  
  if (!tenant.isLoading && !tenant.siteId) {
    throw new Error('No site selected');
  }
  
  return tenant;
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  const tenant = useTenant();
  return tenant.role === 'owner' || tenant.role === 'admin';
}
```

---

## ✅ Verification Checklist

- [ ] Tenant context set correctly per request
- [ ] RLS policies enforce site isolation
- [ ] Agency admins can see all sites
- [ ] Regular users only see their site's data
- [ ] Cross-module access is controlled
- [ ] Data export respects tenant boundaries
- [ ] Site switching works correctly
- [ ] No data leakage between tenants

---

## 📍 Dependencies

- **Requires**: EM-01, EM-05, EM-11
- **Required by**: All modules, all data access
