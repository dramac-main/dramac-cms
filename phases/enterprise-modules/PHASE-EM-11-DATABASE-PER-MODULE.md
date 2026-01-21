# Phase EM-11: Database Per Module (Multi-Tenant Data Isolation)

> **Priority**: 🟠 HIGH
> **Estimated Time**: 10-12 hours
> **Prerequisites**: EM-01, EM-05 (Module Naming Conventions), EM-10 (Module Type System)
> **Status**: ✅ IMPLEMENTED (2026-01-21)

---

## 📁 Implementation Files

The following files were created/modified for this phase:

### Migration
- `migrations/phase-em11-database-per-module.sql` - DDL execution function, registry table, helper functions

### TypeScript Files
- `src/lib/modules/database/module-data-access.ts` - Data access layer with site isolation
- `src/lib/modules/database/index.ts` - Database exports
- `src/lib/modules/sdk/database-sdk.ts` - Developer-facing SDK for module database operations
- `src/lib/modules/sdk/index.ts` - SDK exports
- `src/lib/modules/database/module-database-provisioner.ts` - Enhanced with registry integration

---

## 🔗 Dependencies from Previous Phases

This phase uses utilities from EM-05:

```typescript
// Import from EM-05
import { 
  generateModuleShortId,   // Converts UUID to 8-char prefix
  getModuleSchemaName,     // Returns "mod_{shortId}"
  getModuleTableName       // Returns full table name
} from '@/lib/modules/module-naming';
```

And uses types from EM-10:

```typescript
// Import from EM-10
import type { ModuleType } from '@/lib/modules/types/module-types-v2';

// Module type determines isolation level:
// - widget: Uses module_data table (no dedicated tables)
// - app: Creates prefixed tables in public schema
// - system/custom: Creates dedicated PostgreSQL schema
```

---

## 🎯 Objective

Implement **complete database isolation** for modules so that:
1. Each module has its own tables (via schema or prefix)
2. Each site/tenant has isolated data within a module
3. No module can access another module's data
4. Easy cleanup when modules are uninstalled

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    DRAMAC Platform                      │
├─────────────────────────────────────────────────────────┤
│  public schema (platform tables)                        │
│  ├── agencies, sites, users, profiles                   │
│  ├── modules_v2, module_source                          │
│  └── module_data (for simple widget storage)            │
├─────────────────────────────────────────────────────────┤
│  mod_a1b2c3d4 schema (CRM Module)                       │
│  ├── contacts                                           │
│  ├── companies                                          │
│  ├── deals                                              │
│  └── activities                                         │
├─────────────────────────────────────────────────────────┤
│  mod_e5f6g7h8 schema (Booking Module)                   │
│  ├── appointments                                       │
│  ├── calendars                                          │
│  ├── resources                                          │
│  └── availability                                       │
├─────────────────────────────────────────────────────────┤
│  mod_qr5t6u7v schema (E-commerce Module)                │
│  ├── products                                           │
│  ├── orders                                             │
│  ├── cart_items                                         │
│  └── customers                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Core Database Provisioning Service (3 hours)

```typescript
// src/lib/modules/database/module-database-provisioner.ts

import { createAdminClient } from '@/lib/supabase/admin';
import { 
  generateModuleShortId, 
  getModuleSchemaName 
} from '../module-naming';

export interface ModuleDatabaseConfig {
  moduleId: string;
  moduleType: 'widget' | 'app' | 'integration' | 'system' | 'custom';
  tables: TableDefinition[];
  siteId?: string;  // For site-specific provisioning
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  foreignKeys?: ForeignKeyDefinition[];
  enableRLS?: boolean;
  rlsPolicies?: RLSPolicyDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  primaryKey?: boolean;
  unique?: boolean;
  check?: string;
}

export interface IndexDefinition {
  name?: string;
  columns: string[];
  unique?: boolean;
  where?: string;
  using?: 'btree' | 'gin' | 'gist' | 'hash';
}

export interface ForeignKeyDefinition {
  column: string;
  references: {
    schema?: string;  // 'public' or module schema
    table: string;
    column: string;
  };
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

export interface RLSPolicyDefinition {
  name: string;
  action: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  using?: string;
  withCheck?: string;
  roles?: string[];
}

export interface ProvisionResult {
  success: boolean;
  shortId: string;
  schemaName: string;
  tables: string[];
  error?: string;
}

/**
 * Provision database for a module
 */
export async function provisionModuleDatabase(
  config: ModuleDatabaseConfig
): Promise<ProvisionResult> {
  const supabase = createAdminClient();
  const shortId = generateModuleShortId(config.moduleId);
  const schemaName = getModuleSchemaName(shortId);
  
  const createdTables: string[] = [];
  
  try {
    // Determine isolation strategy based on module type
    const useSchema = ['system', 'custom', 'app'].includes(config.moduleType);
    
    if (useSchema) {
      // Create dedicated schema
      await createSchema(supabase, schemaName);
    }
    
    // Create tables
    for (const table of config.tables) {
      const fullTableName = useSchema 
        ? `${schemaName}.${table.name}`
        : `mod_${shortId}_${table.name}`;
      
      await createTable(supabase, fullTableName, table, schemaName);
      createdTables.push(fullTableName);
      
      // Enable RLS
      if (table.enableRLS !== false) {
        await enableRLS(supabase, fullTableName, table.rlsPolicies);
      }
    }
    
    // Register in module database registry
    await registerModuleDatabase(supabase, {
      moduleId: config.moduleId,
      shortId,
      schemaName: useSchema ? schemaName : null,
      tables: config.tables.map(t => t.name)
    });
    
    return {
      success: true,
      shortId,
      schemaName,
      tables: createdTables
    };
    
  } catch (error: any) {
    // Rollback on failure
    await rollbackProvision(supabase, schemaName, createdTables);
    
    return {
      success: false,
      shortId,
      schemaName,
      tables: [],
      error: error.message
    };
  }
}

/**
 * Create a PostgreSQL schema
 */
async function createSchema(supabase: any, schemaName: string): Promise<void> {
  // Create schema
  const { error: schemaError } = await supabase.rpc('exec_ddl', {
    ddl_command: `CREATE SCHEMA IF NOT EXISTS ${schemaName}`
  });
  
  if (schemaError) throw schemaError;
  
  // Grant usage to authenticated users
  const { error: grantError } = await supabase.rpc('exec_ddl', {
    ddl_command: `GRANT USAGE ON SCHEMA ${schemaName} TO authenticated`
  });
  
  if (grantError) throw grantError;
  
  // Grant all privileges on future tables
  const { error: defaultError } = await supabase.rpc('exec_ddl', {
    ddl_command: `
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName}
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated
    `
  });
  
  if (defaultError) throw defaultError;
}

/**
 * Create a table with all its components
 */
async function createTable(
  supabase: any,
  fullTableName: string,
  table: TableDefinition,
  schemaName: string
): Promise<void> {
  // Build column definitions
  const columnDefs = table.columns.map(col => {
    let def = `"${col.name}" ${col.type}`;
    
    if (col.primaryKey) {
      def += ' PRIMARY KEY';
    }
    if (!col.nullable && !col.primaryKey) {
      def += ' NOT NULL';
    }
    if (col.unique) {
      def += ' UNIQUE';
    }
    if (col.default) {
      def += ` DEFAULT ${col.default}`;
    }
    if (col.check) {
      def += ` CHECK (${col.check})`;
    }
    
    return def;
  }).join(',\n    ');
  
  // Build foreign key constraints
  const fkDefs = (table.foreignKeys || []).map((fk, i) => {
    const refSchema = fk.references.schema || 'public';
    return `CONSTRAINT fk_${table.name}_${i} FOREIGN KEY ("${fk.column}") 
      REFERENCES ${refSchema}."${fk.references.table}"("${fk.references.column}")
      ON DELETE ${fk.onDelete || 'NO ACTION'}
      ON UPDATE ${fk.onUpdate || 'NO ACTION'}`;
  }).join(',\n    ');
  
  // Create table SQL
  const createSQL = `
    CREATE TABLE IF NOT EXISTS ${fullTableName} (
      ${columnDefs}${fkDefs ? ',\n    ' + fkDefs : ''}
    )
  `;
  
  const { error: tableError } = await supabase.rpc('exec_ddl', {
    ddl_command: createSQL
  });
  
  if (tableError) throw tableError;
  
  // Create indexes
  for (const idx of table.indexes || []) {
    const idxName = idx.name || `idx_${table.name}_${idx.columns.join('_')}`;
    const idxSQL = `
      CREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS "${idxName}"
      ON ${fullTableName} ${idx.using ? `USING ${idx.using}` : ''} 
      (${idx.columns.map(c => `"${c}"`).join(', ')})
      ${idx.where ? `WHERE ${idx.where}` : ''}
    `;
    
    const { error: idxError } = await supabase.rpc('exec_ddl', {
      ddl_command: idxSQL
    });
    
    if (idxError) throw idxError;
  }
  
  // Create updated_at trigger
  const hasUpdatedAt = table.columns.some(c => c.name === 'updated_at');
  if (hasUpdatedAt) {
    await createUpdatedAtTrigger(supabase, fullTableName, table.name);
  }
}

/**
 * Create updated_at trigger
 */
async function createUpdatedAtTrigger(
  supabase: any,
  fullTableName: string,
  tableName: string
): Promise<void> {
  // First ensure the function exists
  const { error: fnError } = await supabase.rpc('exec_ddl', {
    ddl_command: `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `
  });
  
  if (fnError) throw fnError;
  
  // Create trigger
  const triggerName = `trigger_${tableName}_updated_at`;
  const { error: triggerError } = await supabase.rpc('exec_ddl', {
    ddl_command: `
      DROP TRIGGER IF EXISTS "${triggerName}" ON ${fullTableName};
      CREATE TRIGGER "${triggerName}"
        BEFORE UPDATE ON ${fullTableName}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `
  });
  
  if (triggerError) throw triggerError;
}

/**
 * Enable RLS and create policies
 */
async function enableRLS(
  supabase: any,
  fullTableName: string,
  policies?: RLSPolicyDefinition[]
): Promise<void> {
  // Enable RLS
  const { error: rlsError } = await supabase.rpc('exec_ddl', {
    ddl_command: `ALTER TABLE ${fullTableName} ENABLE ROW LEVEL SECURITY`
  });
  
  if (rlsError) throw rlsError;
  
  // Create default site_id policy if table has site_id column
  const defaultPolicies: RLSPolicyDefinition[] = policies || [
    {
      name: 'site_isolation',
      action: 'ALL',
      using: `site_id IN (
        SELECT s.id FROM public.sites s
        JOIN public.clients c ON s.client_id = c.id
        JOIN public.agencies a ON c.agency_id = a.id
        JOIN public.agency_members am ON a.id = am.agency_id
        WHERE am.user_id = auth.uid()
      )`
    }
  ];
  
  for (const policy of defaultPolicies) {
    const policySQL = `
      CREATE POLICY "${policy.name}" ON ${fullTableName}
      FOR ${policy.action}
      ${policy.roles ? `TO ${policy.roles.join(', ')}` : ''}
      ${policy.using ? `USING (${policy.using})` : ''}
      ${policy.withCheck ? `WITH CHECK (${policy.withCheck})` : ''}
    `;
    
    // Drop existing policy first
    await supabase.rpc('exec_ddl', {
      ddl_command: `DROP POLICY IF EXISTS "${policy.name}" ON ${fullTableName}`
    });
    
    const { error: policyError } = await supabase.rpc('exec_ddl', {
      ddl_command: policySQL
    });
    
    if (policyError) throw policyError;
  }
}

/**
 * Register module database in registry
 */
async function registerModuleDatabase(
  supabase: any,
  info: {
    moduleId: string;
    shortId: string;
    schemaName: string | null;
    tables: string[];
  }
): Promise<void> {
  const { error } = await supabase
    .from('module_database_registry')
    .upsert({
      module_id: info.moduleId,
      module_short_id: info.shortId,
      uses_schema: !!info.schemaName,
      schema_name: info.schemaName,
      table_names: info.tables,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'module_short_id'
    });
  
  if (error) throw error;
}

/**
 * Rollback a failed provision
 */
async function rollbackProvision(
  supabase: any,
  schemaName: string,
  tables: string[]
): Promise<void> {
  try {
    // Drop tables first
    for (const table of tables.reverse()) {
      await supabase.rpc('exec_ddl', {
        ddl_command: `DROP TABLE IF EXISTS ${table} CASCADE`
      });
    }
    
    // Drop schema if empty
    await supabase.rpc('exec_ddl', {
      ddl_command: `DROP SCHEMA IF EXISTS ${schemaName}`
    });
  } catch (error) {
    console.error('Rollback failed:', error);
  }
}

/**
 * Deprovision (cleanup) a module's database
 */
export async function deprovisionModuleDatabase(
  moduleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const shortId = generateModuleShortId(moduleId);
  
  try {
    // Get registry info
    const { data: registry } = await supabase
      .from('module_database_registry')
      .select('*')
      .eq('module_short_id', shortId)
      .single();
    
    if (registry?.uses_schema) {
      // Drop entire schema
      await supabase.rpc('exec_ddl', {
        ddl_command: `DROP SCHEMA IF EXISTS ${registry.schema_name} CASCADE`
      });
    } else if (registry?.table_names) {
      // Drop individual tables
      for (const tableName of registry.table_names) {
        await supabase.rpc('exec_ddl', {
          ddl_command: `DROP TABLE IF EXISTS mod_${shortId}_${tableName} CASCADE`
        });
      }
    }
    
    // Remove from registry
    await supabase
      .from('module_database_registry')
      .delete()
      .eq('module_short_id', shortId);
    
    return { success: true };
    
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

### Task 2: DDL Execution Function (1 hour)

```sql
-- migrations/20260121_module_database_ddl.sql

-- ============================================================================
-- SECURE DDL EXECUTION (Service Role Only)
-- ============================================================================

-- Function to execute DDL commands (CREATE, ALTER, DROP)
-- Only callable by service_role
CREATE OR REPLACE FUNCTION exec_ddl(ddl_command TEXT)
RETURNS void AS $$
BEGIN
  -- Validate command starts with allowed keywords
  IF NOT (
    ddl_command ~* '^\s*(CREATE|ALTER|DROP|GRANT|REVOKE)'
  ) THEN
    RAISE EXCEPTION 'Only DDL commands (CREATE, ALTER, DROP, GRANT, REVOKE) are allowed';
  END IF;
  
  -- Prevent dangerous operations
  IF ddl_command ~* 'DROP\s+(DATABASE|ROLE|USER)' THEN
    RAISE EXCEPTION 'Cannot drop database, role, or user';
  END IF;
  
  -- Prevent modifications to core schemas
  IF ddl_command ~* '(DROP|ALTER)\s+SCHEMA\s+(public|auth|storage|extensions)' THEN
    RAISE EXCEPTION 'Cannot modify system schemas';
  END IF;
  
  -- Prevent modifications to core tables
  IF ddl_command ~* 'DROP\s+TABLE\s+(public\.)?(agencies|sites|users|profiles|clients|pages|sections|components)' THEN
    RAISE EXCEPTION 'Cannot drop core platform tables';
  END IF;
  
  -- Execute the DDL
  EXECUTE ddl_command;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restrict to service_role only
REVOKE ALL ON FUNCTION exec_ddl(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_ddl(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION exec_ddl(TEXT) TO service_role;

-- ============================================================================
-- MODULE DATABASE REGISTRY (Track what each module created)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_database_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Module identification
  module_id UUID NOT NULL,
  module_short_id TEXT NOT NULL UNIQUE,
  
  -- Schema info
  uses_schema BOOLEAN DEFAULT false,
  schema_name TEXT,
  
  -- Tables (names without prefix/schema)
  table_names TEXT[] DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'migrating', 'deprecated')),
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure schema_name matches pattern
  CONSTRAINT valid_schema CHECK (
    schema_name IS NULL OR schema_name ~* '^mod_[a-f0-9]{8}$'
  )
);

CREATE INDEX idx_module_db_registry_module ON module_database_registry(module_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- List all tables in a module's schema
CREATE OR REPLACE FUNCTION get_module_tables(p_schema_name TEXT)
RETURNS TABLE(table_name TEXT, row_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    (xpath('/row/cnt/text()', 
      query_to_xml(format('SELECT COUNT(*) as cnt FROM %I.%I', p_schema_name, t.table_name), 
      false, true, ''))
    )[1]::TEXT::BIGINT as row_count
  FROM information_schema.tables t
  WHERE t.table_schema = p_schema_name
    AND t.table_type = 'BASE TABLE';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a module schema exists
CREATE OR REPLACE FUNCTION module_schema_exists(p_schema_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM information_schema.schemata
    WHERE schema_name = p_schema_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get storage size of a module's schema
CREATE OR REPLACE FUNCTION get_module_storage_size(p_schema_name TEXT)
RETURNS BIGINT AS $$
DECLARE
  total_size BIGINT := 0;
BEGIN
  SELECT COALESCE(SUM(pg_total_relation_size(quote_ident(p_schema_name) || '.' || quote_ident(table_name))), 0)
  INTO total_size
  FROM information_schema.tables
  WHERE table_schema = p_schema_name
    AND table_type = 'BASE TABLE';
    
  RETURN total_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Task 3: Module Data Access Layer (2 hours)

```typescript
// src/lib/modules/database/module-data-access.ts

import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateModuleShortId, getModuleSchemaName } from '../module-naming';

export interface ModuleDataContext {
  moduleId: string;
  siteId: string;
  userId?: string;
}

/**
 * Create a data access client for a specific module
 * This provides a scoped interface to the module's tables
 */
export function createModuleDataClient(context: ModuleDataContext) {
  const supabase = createClient();
  const shortId = generateModuleShortId(context.moduleId);
  const schemaName = getModuleSchemaName(shortId);
  
  return {
    /**
     * Query a module table
     */
    from(tableName: string) {
      // Supabase supports schema-qualified table names
      const fullTableName = `${schemaName}.${tableName}`;
      
      return supabase
        .from(fullTableName)
        .select('*')
        // Auto-filter by site_id for multi-tenant isolation
        .eq('site_id', context.siteId);
    },
    
    /**
     * Insert into a module table
     */
    async insert(tableName: string, data: Record<string, any> | Record<string, any>[]) {
      const fullTableName = `${schemaName}.${tableName}`;
      const records = Array.isArray(data) ? data : [data];
      
      // Ensure site_id is set on all records
      const withSiteId = records.map(r => ({
        ...r,
        site_id: r.site_id || context.siteId
      }));
      
      return supabase
        .from(fullTableName)
        .insert(withSiteId);
    },
    
    /**
     * Update records in a module table
     */
    async update(
      tableName: string,
      data: Record<string, any>,
      filters: Record<string, any>
    ) {
      const fullTableName = `${schemaName}.${tableName}`;
      
      let query = supabase
        .from(fullTableName)
        .update(data)
        .eq('site_id', context.siteId); // Always scope to site
      
      // Apply additional filters
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      
      return query;
    },
    
    /**
     * Delete records from a module table
     */
    async delete(tableName: string, filters: Record<string, any>) {
      const fullTableName = `${schemaName}.${tableName}`;
      
      let query = supabase
        .from(fullTableName)
        .delete()
        .eq('site_id', context.siteId); // Always scope to site
      
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      
      return query;
    },
    
    /**
     * Execute a raw query (read-only)
     */
    async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
      // Replace table placeholders with full schema names
      const processedSql = sql.replace(
        /\{\{(\w+)\}\}/g, 
        (_, table) => `${schemaName}.${table}`
      );
      
      const { data, error } = await supabase.rpc('execute_module_query', {
        p_module_id: context.moduleId,
        p_site_id: context.siteId,
        p_sql: processedSql,
        p_params: params || []
      });
      
      if (error) throw error;
      return data as T[];
    },
    
    /**
     * Get the schema name for this module
     */
    getSchemaName() {
      return schemaName;
    },
    
    /**
     * Get the full table name
     */
    getTableName(tableName: string) {
      return `${schemaName}.${tableName}`;
    }
  };
}

/**
 * Server-side admin data client (bypasses RLS)
 */
export function createModuleAdminClient(moduleId: string) {
  const supabase = createAdminClient();
  const shortId = generateModuleShortId(moduleId);
  const schemaName = getModuleSchemaName(shortId);
  
  return {
    from(tableName: string) {
      return supabase.from(`${schemaName}.${tableName}`);
    },
    
    async rawQuery(sql: string) {
      return supabase.rpc('exec_ddl', { ddl_command: sql });
    },
    
    getSchemaName() {
      return schemaName;
    }
  };
}
```

---

### Task 4: Module SDK Database Interface (2 hours)

```typescript
// src/lib/modules/sdk/database-sdk.ts

import { createModuleDataClient, type ModuleDataContext } from '../database/module-data-access';

/**
 * Database SDK exposed to modules
 * This is what module developers use to interact with their database
 */
export class ModuleDatabaseSDK {
  private client: ReturnType<typeof createModuleDataClient>;
  private context: ModuleDataContext;
  
  constructor(context: ModuleDataContext) {
    this.context = context;
    this.client = createModuleDataClient(context);
  }
  
  /**
   * Find records
   */
  async find<T = any>(
    table: string,
    options?: {
      where?: Record<string, any>;
      select?: string[];
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    }
  ): Promise<T[]> {
    let query = this.client.from(table);
    
    // Apply select
    if (options?.select) {
      query = query.select(options.select.join(','));
    }
    
    // Apply filters
    if (options?.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (value === null) {
          query = query.is(key, null);
        } else if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object') {
          // Handle operators like { gt: 5, lt: 10 }
          for (const [op, val] of Object.entries(value)) {
            switch (op) {
              case 'gt': query = query.gt(key, val); break;
              case 'gte': query = query.gte(key, val); break;
              case 'lt': query = query.lt(key, val); break;
              case 'lte': query = query.lte(key, val); break;
              case 'like': query = query.like(key, val as string); break;
              case 'ilike': query = query.ilike(key, val as string); break;
              case 'neq': query = query.neq(key, val); break;
            }
          }
        } else {
          query = query.eq(key, value);
        }
      }
    }
    
    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true
      });
    }
    
    // Apply pagination
    if (options?.limit) {
      const start = options.offset || 0;
      query = query.range(start, start + options.limit - 1);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data as T[];
  }
  
  /**
   * Find one record
   */
  async findOne<T = any>(
    table: string,
    where: Record<string, any>
  ): Promise<T | null> {
    const results = await this.find<T>(table, { where, limit: 1 });
    return results[0] || null;
  }
  
  /**
   * Find by ID
   */
  async findById<T = any>(table: string, id: string): Promise<T | null> {
    return this.findOne<T>(table, { id });
  }
  
  /**
   * Create record(s)
   */
  async create<T = any>(
    table: string,
    data: Partial<T> | Partial<T>[]
  ): Promise<T[]> {
    const { data: result, error } = await this.client.insert(table, data as any);
    if (error) throw error;
    return result as T[];
  }
  
  /**
   * Create one record
   */
  async createOne<T = any>(table: string, data: Partial<T>): Promise<T> {
    const results = await this.create<T>(table, data);
    return results[0];
  }
  
  /**
   * Update records
   */
  async update<T = any>(
    table: string,
    where: Record<string, any>,
    data: Partial<T>
  ): Promise<T[]> {
    const { data: result, error } = await this.client.update(table, data as any, where);
    if (error) throw error;
    return result as T[];
  }
  
  /**
   * Update by ID
   */
  async updateById<T = any>(
    table: string,
    id: string,
    data: Partial<T>
  ): Promise<T | null> {
    const results = await this.update<T>(table, { id }, data);
    return results[0] || null;
  }
  
  /**
   * Delete records
   */
  async delete(table: string, where: Record<string, any>): Promise<number> {
    const { error, count } = await this.client.delete(table, where);
    if (error) throw error;
    return count || 0;
  }
  
  /**
   * Delete by ID
   */
  async deleteById(table: string, id: string): Promise<boolean> {
    const count = await this.delete(table, { id });
    return count > 0;
  }
  
  /**
   * Count records
   */
  async count(table: string, where?: Record<string, any>): Promise<number> {
    const fullTableName = this.client.getTableName(table);
    // Use count query
    const results = await this.find(table, { where });
    return results.length;
  }
  
  /**
   * Check if record exists
   */
  async exists(table: string, where: Record<string, any>): Promise<boolean> {
    const result = await this.findOne(table, where);
    return result !== null;
  }
  
  /**
   * Transaction-like batch operations
   * Note: True transactions not available in Supabase client
   */
  async batch<T>(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      table: string;
      data?: any;
      where?: Record<string, any>;
    }>
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (const op of operations) {
      switch (op.type) {
        case 'create':
          const created = await this.create(op.table, op.data);
          results.push(...(created as T[]));
          break;
        case 'update':
          const updated = await this.update(op.table, op.where!, op.data);
          results.push(...(updated as T[]));
          break;
        case 'delete':
          await this.delete(op.table, op.where!);
          break;
      }
    }
    
    return results;
  }
}

/**
 * Create database SDK instance for a module
 */
export function createDatabaseSDK(context: ModuleDataContext): ModuleDatabaseSDK {
  return new ModuleDatabaseSDK(context);
}
```

---

### Task 5: Example Usage in a Module (Documentation)

```typescript
// Example: How a CRM module would use the database SDK

import { createDatabaseSDK } from '@dramac/module-sdk';

// Initialize SDK with context (provided by platform)
const db = createDatabaseSDK({
  moduleId: 'crm-module-uuid',
  siteId: 'site-uuid',
  userId: 'current-user-uuid'
});

// === CRUD Operations ===

// Create a contact
const contact = await db.createOne('contacts', {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  company_id: 'company-uuid'
});

// Find contacts with filters
const contacts = await db.find('contacts', {
  where: { 
    status: 'active',
    lead_score: { gte: 50 }  // >= 50
  },
  orderBy: { column: 'created_at', ascending: false },
  limit: 10
});

// Update a contact
await db.updateById('contacts', contact.id, {
  lead_status: 'qualified'
});

// Delete a contact
await db.deleteById('contacts', contact.id);

// === Complex Queries ===

// Find all contacts for a company
const companyContacts = await db.find('contacts', {
  where: { company_id: 'company-uuid' },
  select: ['id', 'first_name', 'last_name', 'email']
});

// Search contacts
const searchResults = await db.find('contacts', {
  where: {
    email: { ilike: '%@example.com' }
  }
});

// Count active contacts
const activeCount = await db.count('contacts', { status: 'active' });
```

---

## ✅ Verification Checklist

- [ ] Module schema created correctly
- [ ] Tables created with proper structure
- [ ] Indexes applied for performance
- [ ] RLS policies enforcing site isolation
- [ ] Foreign keys work across schemas
- [ ] Module can CRUD its own data
- [ ] Other modules cannot access data
- [ ] Cleanup works when module uninstalled
- [ ] Registry tracks all database objects

---

## 📍 Dependencies

- **Requires**: EM-05 (Naming Conventions), EM-10 (Type System)
- **Required by**: EM-50 (CRM Module), EM-51 (Booking), all other modules

---

## 🔐 Security Considerations

1. **DDL Execution**: Only service_role can execute DDL
2. **Core Table Protection**: Cannot drop platform tables
3. **Schema Isolation**: Each module has its own namespace
4. **RLS Enforcement**: All tables have site_id policies
5. **Audit Trail**: Registry tracks what each module created
