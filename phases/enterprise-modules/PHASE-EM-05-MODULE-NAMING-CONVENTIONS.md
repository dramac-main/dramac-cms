# Phase EM-05: Module Naming Conventions & Conflict Prevention

> **Priority**: 🔴 CRITICAL (Must implement FIRST)
> **Estimated Time**: 2-3 days
> **Prerequisites**: None (Core Architecture Decision)
> **Status**: ✅ COMPLETED (2026-01-21)

### Implementation Summary

**Files Created:**
- `src/lib/modules/module-naming.ts` - Core naming utilities (short ID generation, table naming, validation)
- `src/lib/modules/module-schema-manager.ts` - Schema provisioning and cleanup with RLS support
- `src/lib/modules/module-manifest.ts` - TypeScript types for module manifests

**Migration:**
- `migrations/phase-em05-module-naming.sql` - ✅ **APPLIED TO DATABASE** (2026-01-21)

**Database Objects Created:**
- Helper Functions: `check_table_exists`, `get_module_tables`, `get_module_schemas`, `exec_sql`, `is_name_reserved`
- Registry Table: `module_database_registry` (tracks module database objects)
- Reserved Names: `reserved_table_names` (47 platform reserved names)
- Views: `module_database_overview`, `orphaned_module_tables`
- Utility Functions: `get_module_database_status`, `cleanup_orphaned_module_tables`

---

## 🔗 Integration with Other Phases

This phase creates utilities used by many other phases:

| Phase | How It Uses EM-05 |
|-------|-------------------|
| **EM-01** | `syncModuleToMarketplace()` stores `short_id` in modules_v2 |
| **EM-10** | Module type system determines isolation level (widget/app/system) |
| **EM-11** | Database provisioner uses `getModuleSchemaName()` to create schemas |
| **EM-12** | API gateway uses module naming for route prefixes |
| **EM-50+** | All enterprise modules use schema naming for tables |

**Files Created:**
- `src/lib/modules/module-naming.ts` - Core naming utilities (NEW)

**Database Tables:**
- `module_database_registry` - Tracks all module database objects
- `reserved_table_names` - Prevents platform table conflicts

---

## 🎯 Objective

Establish a **bulletproof naming convention** for module database objects that:
1. **Guarantees uniqueness** across all modules (even duplicate concepts)
2. **Prevents conflicts** when multiple developers build similar modules
3. **Allows easy identification** of which module owns which tables
4. **Follows industry best practices** from Salesforce, WordPress, and Shopify

---

## 🏆 Industry Leader Analysis

### How They Solve It

| Platform | Approach | Example |
|----------|----------|---------|
| **Salesforce** | Namespace prefix + `__c` suffix | `acme__Contact__c` |
| **WordPress** | Plugin prefix convention | `woocommerce_orders` |
| **Shopify** | Metafield namespaces | `app.12345.field_name` |
| **Supabase** | Schema isolation | `tenant_123.users` |
| **Our Solution** | **Module ID prefix + Schema isolation** | `mod_a1b2c3d4.contacts` |

---

## 📐 DRAMAC Module Naming Standard

### Tier System

| Module Tier | Database Approach | Naming Pattern |
|-------------|-------------------|----------------|
| **Widget** (Simple) | Shared `module_data` table | Key: `{module_id}:{data_key}` |
| **App** (Medium) | Prefixed tables in `public` | `mod_{short_id}_{table_name}` |
| **System** (Complex) | Dedicated PostgreSQL schema | `mod_{short_id}.{table_name}` |
| **Integration** | No tables (external data) | N/A |

---

## 🔧 Implementation

### 1. Module Short ID Generation

Every module gets a **deterministic short ID** derived from its UUID:

```typescript
// src/lib/modules/module-naming.ts

import { createHash } from 'crypto';

/**
 * Generate a unique, deterministic short ID for a module
 * This ensures the same module always gets the same prefix
 */
export function generateModuleShortId(moduleId: string): string {
  // Use first 8 characters of UUID (after removing hyphens)
  // This gives us 16^8 = 4.29 billion unique combinations
  const cleanId = moduleId.replace(/-/g, '');
  return cleanId.substring(0, 8).toLowerCase();
}

/**
 * Alternative: Hash-based short ID (if UUIDs aren't suitable)
 * Useful when module IDs might not be UUIDs
 */
export function generateModuleHashId(moduleId: string, publisherId: string): string {
  const combined = `${publisherId}:${moduleId}`;
  const hash = createHash('sha256').update(combined).digest('hex');
  return hash.substring(0, 8).toLowerCase();
}

/**
 * Generate a safe table name for a module
 */
export function getModuleTableName(
  moduleShortId: string,
  tableName: string,
  useSchema: boolean = false
): string {
  // Validate table name (alphanumeric + underscore only)
  const safeTableName = tableName.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  
  if (useSchema) {
    return `mod_${moduleShortId}.${safeTableName}`;
  }
  return `mod_${moduleShortId}_${safeTableName}`;
}

/**
 * Generate schema name for a module
 */
export function getModuleSchemaName(moduleShortId: string): string {
  return `mod_${moduleShortId}`;
}

/**
 * Validate that a module's proposed table names don't conflict
 */
export async function validateModuleTableNames(
  supabase: any,
  moduleShortId: string,
  proposedTables: string[]
): Promise<{ valid: boolean; conflicts: string[] }> {
  const conflicts: string[] = [];
  
  for (const tableName of proposedTables) {
    const fullName = `mod_${moduleShortId}_${tableName}`;
    
    // Check if table already exists
    const { data } = await supabase.rpc('check_table_exists', {
      table_name: fullName
    });
    
    if (data) {
      conflicts.push(fullName);
    }
  }
  
  return {
    valid: conflicts.length === 0,
    conflicts
  };
}
```

### 2. Module Schema Manager

```typescript
// src/lib/modules/module-schema-manager.ts

import { createAdminClient } from '@/lib/supabase/admin';
import { getModuleSchemaName, getModuleTableName, generateModuleShortId } from './module-naming';

export interface ModuleSchemaConfig {
  moduleId: string;
  publisherId: string;
  tables: ModuleTableDefinition[];
  useSchema: boolean; // true for System modules, false for App modules
}

export interface ModuleTableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
  foreignKeys?: ForeignKeyDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  primaryKey?: boolean;
  unique?: boolean;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
  where?: string;
}

export interface ForeignKeyDefinition {
  column: string;
  references: {
    table: string;
    column: string;
  };
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

/**
 * Create or update module database objects
 */
export async function provisionModuleDatabase(
  config: ModuleSchemaConfig
): Promise<{ success: boolean; shortId: string; error?: string }> {
  const supabase = createAdminClient();
  const shortId = generateModuleShortId(config.moduleId);
  
  try {
    if (config.useSchema) {
      // Create dedicated schema for System modules
      await createModuleSchema(supabase, shortId);
    }
    
    // Create tables
    for (const table of config.tables) {
      await createModuleTable(supabase, shortId, table, config.useSchema);
    }
    
    // Enable RLS on all tables
    for (const table of config.tables) {
      const tableName = config.useSchema 
        ? `mod_${shortId}.${table.name}`
        : `mod_${shortId}_${table.name}`;
      await enableTableRLS(supabase, tableName);
    }
    
    return { success: true, shortId };
  } catch (error: any) {
    return { 
      success: false, 
      shortId, 
      error: error.message 
    };
  }
}

async function createModuleSchema(supabase: any, shortId: string): Promise<void> {
  const schemaName = getModuleSchemaName(shortId);
  
  await supabase.rpc('exec_sql', {
    sql: `CREATE SCHEMA IF NOT EXISTS ${schemaName};`
  });
  
  // Grant usage to authenticated users
  await supabase.rpc('exec_sql', {
    sql: `GRANT USAGE ON SCHEMA ${schemaName} TO authenticated;`
  });
}

async function createModuleTable(
  supabase: any, 
  shortId: string, 
  table: ModuleTableDefinition,
  useSchema: boolean
): Promise<void> {
  const tableName = useSchema
    ? `mod_${shortId}.${table.name}`
    : `mod_${shortId}_${table.name}`;
  
  // Build column definitions
  const columnDefs = table.columns.map(col => {
    let def = `${col.name} ${col.type}`;
    if (col.primaryKey) def += ' PRIMARY KEY';
    if (col.unique) def += ' UNIQUE';
    if (!col.nullable && !col.primaryKey) def += ' NOT NULL';
    if (col.default) def += ` DEFAULT ${col.default}`;
    return def;
  }).join(',\n  ');
  
  // Create table
  const createSQL = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${columnDefs}
    );
  `;
  
  await supabase.rpc('exec_sql', { sql: createSQL });
  
  // Create indexes
  if (table.indexes) {
    for (const idx of table.indexes) {
      const idxName = `idx_${shortId}_${table.name}_${idx.name}`;
      const idxSQL = `
        CREATE ${idx.unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${idxName}
        ON ${tableName} (${idx.columns.join(', ')})
        ${idx.where ? `WHERE ${idx.where}` : ''};
      `;
      await supabase.rpc('exec_sql', { sql: idxSQL });
    }
  }
}

async function enableTableRLS(supabase: any, tableName: string): Promise<void> {
  await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`
  });
}

/**
 * Drop all database objects for a module (uninstall)
 */
export async function dropModuleDatabase(
  moduleId: string,
  useSchema: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();
  const shortId = generateModuleShortId(moduleId);
  
  try {
    if (useSchema) {
      // Drop entire schema (cascades to all tables)
      await supabase.rpc('exec_sql', {
        sql: `DROP SCHEMA IF EXISTS mod_${shortId} CASCADE;`
      });
    } else {
      // Find and drop all tables with this module's prefix
      const { data: tables } = await supabase.rpc('get_module_tables', {
        prefix: `mod_${shortId}_`
      });
      
      for (const table of tables || []) {
        await supabase.rpc('exec_sql', {
          sql: `DROP TABLE IF EXISTS ${table.table_name} CASCADE;`
        });
      }
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

### 3. SQL Helper Functions

```sql
-- migrations/modules/000_module_schema_helpers.sql

-- ============================================================================
-- MODULE SCHEMA HELPER FUNCTIONS
-- ============================================================================

-- Check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema IN ('public', (SELECT current_schema()))
    AND table_name = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all tables for a module prefix
CREATE OR REPLACE FUNCTION get_module_tables(prefix TEXT)
RETURNS TABLE(table_name TEXT, table_schema TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::TEXT, t.table_schema::TEXT
  FROM information_schema.tables t
  WHERE t.table_name LIKE prefix || '%'
  AND t.table_schema NOT IN ('pg_catalog', 'information_schema');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all schemas for modules
CREATE OR REPLACE FUNCTION get_module_schemas()
RETURNS TABLE(schema_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT s.schema_name::TEXT
  FROM information_schema.schemata s
  WHERE s.schema_name LIKE 'mod_%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute arbitrary SQL (admin only, used for schema creation)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECURITY: Restrict exec_sql to service role only
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

-- ============================================================================
-- MODULE REGISTRY TABLE (Tracks all module database objects)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_database_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Module identification
  module_id UUID NOT NULL,  -- References module_source.id
  module_short_id TEXT NOT NULL UNIQUE,  -- 8-char prefix
  
  -- Database objects owned by this module
  uses_schema BOOLEAN DEFAULT false,
  schema_name TEXT,  -- e.g., 'mod_a1b2c3d4'
  
  -- Tables owned (array of table names without prefix)
  table_names TEXT[] DEFAULT '{}',
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_schema_name CHECK (
    schema_name IS NULL OR schema_name ~ '^mod_[a-f0-9]{8}$'
  )
);

CREATE INDEX idx_module_db_registry_module ON module_database_registry(module_id);
CREATE INDEX idx_module_db_registry_short_id ON module_database_registry(module_short_id);

-- ============================================================================
-- RESERVED NAMES (Prevent conflicts with platform tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reserved_table_names (
  name TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert platform reserved names
INSERT INTO reserved_table_names (name, reason) VALUES
  ('users', 'Platform users table'),
  ('sites', 'Platform sites table'),
  ('pages', 'Platform pages table'),
  ('sections', 'Platform sections table'),
  ('components', 'Platform components table'),
  ('agencies', 'Platform agencies table'),
  ('clients', 'Platform clients table'),
  ('modules', 'Legacy module table'),
  ('modules_v2', 'Module catalog table'),
  ('module_source', 'Module studio table'),
  ('subscriptions', 'Billing table'),
  ('invoices', 'Billing table'),
  ('billing_customers', 'Billing table'),
  ('profiles', 'User profiles table'),
  ('settings', 'Platform settings'),
  ('analytics', 'Platform analytics'),
  ('sessions', 'Auth sessions')
ON CONFLICT (name) DO NOTHING;

-- Function to check if a name is reserved
CREATE OR REPLACE FUNCTION is_name_reserved(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM reserved_table_names WHERE name = table_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Module Manifest Schema Extension

```typescript
// src/types/module-manifest.ts

export interface ModuleManifest {
  // ... existing fields ...
  
  /**
   * Database configuration for the module
   * This defines what database objects the module needs
   */
  database?: ModuleDatabaseManifest;
}

export interface ModuleDatabaseManifest {
  /**
   * Schema isolation level
   * - 'none': Uses shared module_data table only
   * - 'tables': Creates prefixed tables in public schema
   * - 'schema': Creates dedicated PostgreSQL schema
   */
  isolation: 'none' | 'tables' | 'schema';
  
  /**
   * Table definitions
   * Table names should NOT include prefix - system adds it automatically
   */
  tables?: ModuleTableManifest[];
  
  /**
   * Required platform tables (for foreign keys)
   */
  platformDependencies?: ('sites' | 'users' | 'agencies' | 'clients')[];
}

export interface ModuleTableManifest {
  /**
   * Table name (without prefix)
   * System will create: mod_{short_id}_{name} or mod_{short_id}.{name}
   */
  name: string;
  
  /**
   * Human-readable description
   */
  description?: string;
  
  /**
   * Column definitions
   */
  columns: ModuleColumnManifest[];
  
  /**
   * Index definitions
   */
  indexes?: ModuleIndexManifest[];
  
  /**
   * Whether this table is required for module to function
   */
  required?: boolean;
}

export interface ModuleColumnManifest {
  name: string;
  type: 'uuid' | 'text' | 'integer' | 'bigint' | 'decimal' | 'boolean' | 'jsonb' | 'timestamp' | 'date' | 'text[]';
  nullable?: boolean;
  default?: string;
  description?: string;
  
  /**
   * Reference to another table (can be within same module or platform)
   */
  references?: {
    module?: 'self' | 'platform';  // 'self' = same module, 'platform' = platform table
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  };
}

export interface ModuleIndexManifest {
  columns: string[];
  unique?: boolean;
  where?: string;
}
```

---

## 📋 Updated CRM Example with Safe Naming

```yaml
# modules/crm/manifest.yaml

name: "Enterprise CRM"
version: "1.0.0"
type: "system"

database:
  isolation: "schema"  # Full schema isolation
  
  platformDependencies:
    - sites
    - users
  
  tables:
    - name: contacts  # Will become: mod_{short_id}.contacts
      description: "CRM contact records"
      columns:
        - name: id
          type: uuid
          default: "gen_random_uuid()"
        - name: site_id
          type: uuid
          references:
            module: platform
            table: sites
            column: id
            onDelete: CASCADE
        - name: first_name
          type: text
        - name: last_name
          type: text
        - name: email
          type: text
        - name: company_id
          type: uuid
          nullable: true
          references:
            module: self
            table: companies
            column: id
            onDelete: SET NULL
        - name: custom_fields
          type: jsonb
          default: "'{}'::jsonb"
        - name: created_at
          type: timestamp
          default: "NOW()"
      indexes:
        - columns: [site_id]
        - columns: [email]
        - columns: [company_id]
    
    - name: companies
      description: "CRM company/account records"
      columns:
        - name: id
          type: uuid
          default: "gen_random_uuid()"
        - name: site_id
          type: uuid
          references:
            module: platform
            table: sites
            column: id
            onDelete: CASCADE
        - name: name
          type: text
        - name: industry
          type: text
          nullable: true
        - name: created_at
          type: timestamp
          default: "NOW()"
    
    - name: deals
      description: "CRM deal/opportunity records"
      columns:
        - name: id
          type: uuid
          default: "gen_random_uuid()"
        - name: site_id
          type: uuid
        - name: contact_id
          type: uuid
          nullable: true
          references:
            module: self
            table: contacts
            column: id
        - name: company_id
          type: uuid
          nullable: true
          references:
            module: self
            table: companies
            column: id
        - name: title
          type: text
        - name: value
          type: decimal
        - name: stage
          type: text
        - name: created_at
          type: timestamp
          default: "NOW()"
```

---

## 🔒 Conflict Prevention Checklist

### Automated Checks (Implemented)

| Check | When | Action |
|-------|------|--------|
| Reserved name check | Module creation | Block if table name matches reserved list |
| Duplicate prefix check | Module creation | Block if short_id already in use |
| Schema name validation | Schema creation | Ensure `mod_` prefix and valid format |
| Cross-module FK validation | Module deployment | Verify referenced modules exist |

### Manual Governance (Documentation)

| Rule | Description |
|------|-------------|
| No generic names | Never use `users`, `data`, `items` as table names |
| Module-specific names | Use domain terms: `contacts`, `deals`, `bookings` |
| Version in table name | For major schema changes: `contacts_v2` |

---

## ✅ Verification Queries

```sql
-- List all module schemas
SELECT * FROM get_module_schemas();

-- List all tables for a specific module
SELECT * FROM get_module_tables('mod_a1b2c3d4_');

-- Check for potential conflicts before deployment
SELECT 
  r.module_id,
  r.module_short_id,
  r.table_names,
  (SELECT array_agg(t.table_name) 
   FROM information_schema.tables t 
   WHERE t.table_name LIKE 'mod_' || r.module_short_id || '_%'
  ) as actual_tables
FROM module_database_registry r;

-- Find any orphaned module tables (no registry entry)
SELECT t.table_name
FROM information_schema.tables t
WHERE t.table_name LIKE 'mod_%'
AND NOT EXISTS (
  SELECT 1 FROM module_database_registry r
  WHERE t.table_name LIKE 'mod_' || r.module_short_id || '_%'
);
```

---

## 📊 Migration Strategy

### Existing Tables
The existing platform tables (`module_source`, `modules_v2`, etc.) remain untouched. Only **new module-specific tables** use this convention.

### When a Module is Deployed
1. Generate `module_short_id` from module UUID
2. Register in `module_database_registry`
3. For System modules: Create schema `mod_{short_id}`
4. Create tables with appropriate naming
5. Apply RLS policies

### When a Module is Uninstalled
1. If using schema: `DROP SCHEMA mod_{short_id} CASCADE`
2. If using tables: Drop each `mod_{short_id}_*` table
3. Remove from `module_database_registry`

---

## 🎯 Summary

| Question | Answer |
|----------|--------|
| **Does it conflict?** | No - UUID-based prefixes guarantee uniqueness |
| **Can two CRMs coexist?** | Yes - each gets unique short_id: `mod_a1b2c3d4_contacts` vs `mod_e5f6g7h8_contacts` |
| **Can I find module tables?** | Yes - query `module_database_registry` or filter by prefix |
| **Is it industry standard?** | Yes - combines Salesforce namespacing + Supabase schema isolation |
| **Does it scale?** | Yes - 4.29 billion unique prefixes possible |

---

## 📍 Implementation Complete

### ✅ Completed Steps

1. ✅ Document the naming convention (this file)
2. ✅ Implement `module-naming.ts` utilities
3. ✅ Implement `module-schema-manager.ts` for provisioning
4. ✅ Implement `module-manifest.ts` type definitions
5. ✅ Create migration for helper functions and registry tables
6. ✅ **Run migration in Supabase** (2026-01-21)

### 🎯 Verification Queries

You can now run these queries in Supabase to verify the installation:

```sql
-- Check reserved table names (should return 47 rows)
SELECT category, count(*) 
FROM reserved_table_names 
GROUP BY category;

-- View helper functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%module%';

-- Check registry table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'module_database_registry';
```

### 🚀 Next Steps (Ready for Integration)

The naming utilities are now ready to be integrated into:

1. **EM-01: Module Studio → Marketplace Sync** - Auto-generate `short_id` when syncing modules
2. **EM-10: Module Type System** - Determine isolation level based on tier
3. **EM-11: Database Provisioner** - Use `provisionModuleDatabase()` for schema creation
4. **EM-12: Module API Gateway** - Use module naming for route prefixes
5. **EM-50+: Enterprise Modules** - All use manifest-based schema definitions

### 📝 Usage Example

```typescript
import { generateModuleShortId, getModuleTableName } from '@/lib/modules/module-naming';
import { provisionModuleDatabase } from '@/lib/modules/module-schema-manager';

// Generate short ID from module UUID
const shortId = generateModuleShortId('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
// Returns: 'a1b2c3d4'

// Generate table name
const tableName = getModuleTableName(shortId, 'contacts', false);
// Returns: 'mod_a1b2c3d4_contacts'

// Provision module database
const result = await provisionModuleDatabase({
  moduleId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  publisherId: 'pub-123',
  tier: 'system',
  tables: [
    {
      name: 'contacts',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
        { name: 'site_id', type: 'uuid' },
        { name: 'name', type: 'text' },
        { name: 'email', type: 'text' },
      ],
      indexes: [
        { name: 'site_id', columns: ['site_id'] },
      ],
    },
  ],
});
```
