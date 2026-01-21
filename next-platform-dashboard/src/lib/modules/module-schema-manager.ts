/**
 * Module Schema Manager
 * 
 * Phase EM-05: Module Naming Conventions & Conflict Prevention
 * 
 * Manages the provisioning and cleanup of module database objects:
 * - Creates/drops PostgreSQL schemas for System modules
 * - Creates/drops prefixed tables for App modules
 * - Applies Row Level Security policies
 * - Registers module database objects in the registry
 * 
 * @see phases/enterprise-modules/PHASE-EM-05-MODULE-NAMING-CONVENTIONS.md
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Note: This module uses 'any' types for Supabase client in places where we call
// RPC functions and access tables created by phase-em05-module-naming.sql.
// After running the migration and regenerating types, these can be properly typed.

import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import { 
  getModuleSchemaName, 
  getModuleTableName, 
  getModuleIndexName,
  generateModuleShortId,
  sanitizeTableName,
  isValidShortId,
  validateModuleTableNames,
  isShortIdInUse,
  type ModuleTier,
  shouldUseSchema,
} from './module-naming';

// Type for untyped Supabase operations (new tables/RPCs not in generated types yet)
type UntypedSupabase = SupabaseClient<any, any, any>;

// ============================================================================
// TYPES
// ============================================================================

export interface ModuleSchemaConfig {
  /** The full UUID of the module */
  moduleId: string;
  /** The publisher/developer ID */
  publisherId: string;
  /** Table definitions to create */
  tables: ModuleTableDefinition[];
  /** Module tier determines isolation level */
  tier: ModuleTier;
  /** Optional: Use schema isolation (auto-determined from tier if not specified) */
  useSchema?: boolean;
}

export interface ModuleTableDefinition {
  /** Table name without prefix */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Column definitions */
  columns: ColumnDefinition[];
  /** Optional indexes */
  indexes?: IndexDefinition[];
  /** Optional foreign key constraints */
  foreignKeys?: ForeignKeyDefinition[];
  /** RLS policy configuration */
  rlsConfig?: RLSConfiguration;
}

export interface ColumnDefinition {
  /** Column name */
  name: string;
  /** PostgreSQL data type */
  type: string;
  /** Whether NULL is allowed (default: false for non-PK) */
  nullable?: boolean;
  /** Default value expression */
  default?: string;
  /** Is this the primary key? */
  primaryKey?: boolean;
  /** Is this column unique? */
  unique?: boolean;
  /** Column comment/description */
  comment?: string;
}

export interface IndexDefinition {
  /** Index identifier (used in generated name) */
  name: string;
  /** Columns to index */
  columns: string[];
  /** Is this a unique index? */
  unique?: boolean;
  /** Optional WHERE clause for partial index */
  where?: string;
}

export interface ForeignKeyDefinition {
  /** Column in this table */
  column: string;
  /** Reference configuration */
  references: {
    /** Target table (can be platform table or module table) */
    table: string;
    /** Target column */
    column: string;
    /** Whether this is a platform table reference */
    isPlatformTable?: boolean;
  };
  /** ON DELETE action */
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  /** ON UPDATE action */
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

export interface RLSConfiguration {
  /** Enable RLS on this table */
  enabled: boolean;
  /** Force RLS even for table owner */
  force?: boolean;
  /** Pre-built policy type */
  policyType?: 'site_isolation' | 'agency_isolation' | 'user_isolation' | 'custom';
  /** Custom policies (if policyType is 'custom') */
  customPolicies?: RLSPolicy[];
}

export interface RLSPolicy {
  /** Policy name */
  name: string;
  /** Operation: SELECT, INSERT, UPDATE, DELETE, ALL */
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  /** TO role (usually 'authenticated') */
  role?: string;
  /** USING clause expression */
  using?: string;
  /** WITH CHECK clause expression */
  withCheck?: string;
}

export interface ProvisionResult {
  success: boolean;
  shortId: string;
  schemaName?: string;
  createdTables: string[];
  createdIndexes: string[];
  error?: string;
  warnings: string[];
}

export interface DropResult {
  success: boolean;
  droppedTables: string[];
  droppedSchema?: string;
  error?: string;
}

// ============================================================================
// SCHEMA PROVISIONING
// ============================================================================

/**
 * Create or update module database objects
 * 
 * This is the main entry point for provisioning a module's database resources.
 * Based on the module tier, it will:
 * - System tier: Create a dedicated schema with tables
 * - App tier: Create prefixed tables in public schema
 * - Widget/Integration: No tables created
 * 
 * @param config - Module schema configuration
 * @returns Result of the provisioning operation
 */
export async function provisionModuleDatabase(
  config: ModuleSchemaConfig
): Promise<ProvisionResult> {
  const supabase = createAdminClient() as UntypedSupabase;
  const shortId = generateModuleShortId(config.moduleId);
  const useSchema = config.useSchema ?? shouldUseSchema(config.tier);
  
  const result: ProvisionResult = {
    success: false,
    shortId,
    createdTables: [],
    createdIndexes: [],
    warnings: [],
  };
  
  try {
    // Validate short ID format
    if (!isValidShortId(shortId)) {
      result.error = `Invalid short ID generated: ${shortId}`;
      return result;
    }
    
    // Check if short ID is already in use by another module
    const shortIdInUse = await isShortIdInUse(shortId);
    if (shortIdInUse) {
      result.error = `Short ID ${shortId} is already in use by another module`;
      return result;
    }
    
    // Validate table names
    const tableNames = config.tables.map(t => t.name);
    const validation = await validateModuleTableNames(shortId, tableNames);
    
    if (validation.reservedConflicts.length > 0) {
      result.error = `Table names conflict with reserved names: ${validation.reservedConflicts.join(', ')}`;
      return result;
    }
    
    if (validation.conflicts.length > 0) {
      result.warnings.push(`Some tables already exist and will be skipped: ${validation.conflicts.join(', ')}`);
    }
    
    // Create schema if needed
    if (useSchema) {
      await createModuleSchema(supabase, shortId);
      result.schemaName = getModuleSchemaName(shortId);
    }
    
    // Create tables
    for (const table of config.tables) {
      const tableName = useSchema
        ? `${getModuleSchemaName(shortId)}.${sanitizeTableName(table.name)}`
        : getModuleTableName(shortId, table.name, false);
      
      await createModuleTable(supabase, shortId, table, useSchema);
      result.createdTables.push(tableName);
      
      // Create indexes
      if (table.indexes) {
        for (const idx of table.indexes) {
          const indexName = getModuleIndexName(shortId, table.name, idx.name);
          await createIndex(supabase, tableName, indexName, idx);
          result.createdIndexes.push(indexName);
        }
      }
      
      // Apply RLS
      const rlsConfig = table.rlsConfig ?? { enabled: true, policyType: 'site_isolation' };
      if (rlsConfig.enabled) {
        await applyRLS(supabase, tableName, table.name, shortId, rlsConfig);
      }
    }
    
    // Register in module_database_registry
    await registerModuleDatabase(supabase, {
      moduleId: config.moduleId,
      shortId,
      useSchema,
      tableNames: config.tables.map(t => t.name),
    });
    
    result.success = true;
    return result;
    
  } catch (error: unknown) {
    result.error = error instanceof Error ? error.message : String(error);
    
    // Attempt cleanup on failure
    try {
      if (useSchema) {
        await supabase.rpc('exec_sql', {
          sql: `DROP SCHEMA IF EXISTS mod_${shortId} CASCADE;`
        });
      } else {
        // Drop any tables that were created
        for (const tableName of result.createdTables) {
          await supabase.rpc('exec_sql', {
            sql: `DROP TABLE IF EXISTS ${tableName} CASCADE;`
          });
        }
      }
    } catch (cleanupError) {
      result.warnings.push(`Cleanup failed: ${cleanupError}`);
    }
    
    return result;
  }
}

/**
 * Create a PostgreSQL schema for a module
 */
async function createModuleSchema(supabase: UntypedSupabase, shortId: string): Promise<void> {
  const schemaName = getModuleSchemaName(shortId);
  
  // Create the schema
  await supabase.rpc('exec_sql', {
    sql: `CREATE SCHEMA IF NOT EXISTS ${schemaName};`
  });
  
  // Grant usage to authenticated users
  await supabase.rpc('exec_sql', {
    sql: `GRANT USAGE ON SCHEMA ${schemaName} TO authenticated;`
  });
  
  // Grant usage to service_role
  await supabase.rpc('exec_sql', {
    sql: `GRANT ALL ON SCHEMA ${schemaName} TO service_role;`
  });
}

/**
 * Create a table for a module
 */
async function createModuleTable(
  supabase: UntypedSupabase,
  shortId: string,
  table: ModuleTableDefinition,
  useSchema: boolean
): Promise<void> {
  const tableName = useSchema
    ? `${getModuleSchemaName(shortId)}.${sanitizeTableName(table.name)}`
    : getModuleTableName(shortId, table.name, false);
  
  // Build column definitions
  const columnDefs = table.columns.map(col => {
    let def = `"${col.name}" ${col.type}`;
    if (col.primaryKey) def += ' PRIMARY KEY';
    if (col.unique && !col.primaryKey) def += ' UNIQUE';
    if (!col.nullable && !col.primaryKey) def += ' NOT NULL';
    if (col.default) def += ` DEFAULT ${col.default}`;
    return def;
  }).join(',\n    ');
  
  // Build foreign key constraints
  let fkDefs = '';
  if (table.foreignKeys && table.foreignKeys.length > 0) {
    const fkConstraints = table.foreignKeys.map((fk, i) => {
      let refTable = fk.references.table;
      
      // If referencing another module table, add the prefix
      if (!fk.references.isPlatformTable) {
        refTable = useSchema
          ? `${getModuleSchemaName(shortId)}.${sanitizeTableName(fk.references.table)}`
          : getModuleTableName(shortId, fk.references.table, false);
      }
      
      let constraint = `CONSTRAINT fk_${shortId}_${table.name}_${i} `;
      constraint += `FOREIGN KEY ("${fk.column}") REFERENCES ${refTable}("${fk.references.column}")`;
      if (fk.onDelete) constraint += ` ON DELETE ${fk.onDelete}`;
      if (fk.onUpdate) constraint += ` ON UPDATE ${fk.onUpdate}`;
      return constraint;
    }).join(',\n    ');
    
    fkDefs = `,\n    ${fkConstraints}`;
  }
  
  // Create table
  const createSQL = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
    ${columnDefs}${fkDefs}
    );
  `;
  
  await supabase.rpc('exec_sql', { sql: createSQL });
  
  // Add column comments if provided
  for (const col of table.columns) {
    if (col.comment) {
      await supabase.rpc('exec_sql', {
        sql: `COMMENT ON COLUMN ${tableName}."${col.name}" IS '${col.comment.replace(/'/g, "''")}';`
      });
    }
  }
  
  // Add table comment if provided
  if (table.description) {
    await supabase.rpc('exec_sql', {
      sql: `COMMENT ON TABLE ${tableName} IS '${table.description.replace(/'/g, "''")}';`
    });
  }
  
  // Grant permissions
  await supabase.rpc('exec_sql', {
    sql: `GRANT SELECT, INSERT, UPDATE, DELETE ON ${tableName} TO authenticated;`
  });
  
  await supabase.rpc('exec_sql', {
    sql: `GRANT ALL ON ${tableName} TO service_role;`
  });
}

/**
 * Create an index on a module table
 */
async function createIndex(
  supabase: UntypedSupabase,
  tableName: string,
  indexName: string,
  idx: IndexDefinition
): Promise<void> {
  const columns = idx.columns.map(c => `"${c}"`).join(', ');
  const uniqueClause = idx.unique ? 'UNIQUE ' : '';
  const whereClause = idx.where ? ` WHERE ${idx.where}` : '';
  
  const sql = `
    CREATE ${uniqueClause}INDEX IF NOT EXISTS "${indexName}"
    ON ${tableName} (${columns})${whereClause};
  `;
  
  await supabase.rpc('exec_sql', { sql });
}

/**
 * Apply Row Level Security to a table
 */
async function applyRLS(
  supabase: UntypedSupabase,
  fullTableName: string,
  tableName: string,
  shortId: string,
  config: RLSConfiguration
): Promise<void> {
  // Enable RLS
  await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE ${fullTableName} ENABLE ROW LEVEL SECURITY;`
  });
  
  // Force RLS if requested
  if (config.force) {
    await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE ${fullTableName} FORCE ROW LEVEL SECURITY;`
    });
  }
  
  // Apply policies based on type
  switch (config.policyType) {
    case 'site_isolation':
      await applySiteIsolationPolicy(supabase, fullTableName, tableName, shortId);
      break;
    case 'agency_isolation':
      await applyAgencyIsolationPolicy(supabase, fullTableName, tableName, shortId);
      break;
    case 'user_isolation':
      await applyUserIsolationPolicy(supabase, fullTableName, tableName, shortId);
      break;
    case 'custom':
      if (config.customPolicies) {
        for (const policy of config.customPolicies) {
          await applyCustomPolicy(supabase, fullTableName, tableName, shortId, policy);
        }
      }
      break;
  }
}

/**
 * Standard site isolation policy - most common for module tables
 */
async function applySiteIsolationPolicy(
  supabase: UntypedSupabase,
  fullTableName: string,
  tableName: string,
  shortId: string
): Promise<void> {
  const policyName = `policy_${shortId}_${tableName}_site_isolation`;
  
  // Select policy
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "${policyName}_select" ON ${fullTableName}
      FOR SELECT TO authenticated
      USING (
        site_id IN (
          SELECT s.id FROM sites s
          WHERE s.agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
          )
        )
      );
    `
  });
  
  // Insert policy
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "${policyName}_insert" ON ${fullTableName}
      FOR INSERT TO authenticated
      WITH CHECK (
        site_id IN (
          SELECT s.id FROM sites s
          WHERE s.agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
          )
        )
      );
    `
  });
  
  // Update policy
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "${policyName}_update" ON ${fullTableName}
      FOR UPDATE TO authenticated
      USING (
        site_id IN (
          SELECT s.id FROM sites s
          WHERE s.agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
          )
        )
      )
      WITH CHECK (
        site_id IN (
          SELECT s.id FROM sites s
          WHERE s.agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
          )
        )
      );
    `
  });
  
  // Delete policy
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "${policyName}_delete" ON ${fullTableName}
      FOR DELETE TO authenticated
      USING (
        site_id IN (
          SELECT s.id FROM sites s
          WHERE s.agency_id IN (
            SELECT agency_id FROM profiles WHERE id = auth.uid()
          )
        )
      );
    `
  });
}

/**
 * Agency-level isolation policy
 */
async function applyAgencyIsolationPolicy(
  supabase: UntypedSupabase,
  fullTableName: string,
  tableName: string,
  shortId: string
): Promise<void> {
  const policyName = `policy_${shortId}_${tableName}_agency_isolation`;
  
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "${policyName}" ON ${fullTableName}
      FOR ALL TO authenticated
      USING (
        agency_id IN (
          SELECT agency_id FROM profiles WHERE id = auth.uid()
        )
      )
      WITH CHECK (
        agency_id IN (
          SELECT agency_id FROM profiles WHERE id = auth.uid()
        )
      );
    `
  });
}

/**
 * User-level isolation policy (user can only see their own data)
 */
async function applyUserIsolationPolicy(
  supabase: UntypedSupabase,
  fullTableName: string,
  tableName: string,
  shortId: string
): Promise<void> {
  const policyName = `policy_${shortId}_${tableName}_user_isolation`;
  
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "${policyName}" ON ${fullTableName}
      FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
    `
  });
}

/**
 * Apply a custom RLS policy
 */
async function applyCustomPolicy(
  supabase: UntypedSupabase,
  fullTableName: string,
  tableName: string,
  shortId: string,
  policy: RLSPolicy
): Promise<void> {
  const policyName = `policy_${shortId}_${tableName}_${policy.name}`;
  const role = policy.role ?? 'authenticated';
  
  let sql = `CREATE POLICY "${policyName}" ON ${fullTableName}`;
  sql += ` FOR ${policy.operation} TO ${role}`;
  if (policy.using) sql += ` USING (${policy.using})`;
  if (policy.withCheck) sql += ` WITH CHECK (${policy.withCheck})`;
  sql += ';';
  
  await supabase.rpc('exec_sql', { sql });
}

/**
 * Register module database objects in the registry
 */
async function registerModuleDatabase(
  supabase: UntypedSupabase,
  config: {
    moduleId: string;
    shortId: string;
    useSchema: boolean;
    tableNames: string[];
  }
): Promise<void> {
  const { moduleId, shortId, useSchema, tableNames } = config;
  
  await supabase
    .from('module_database_registry')
    .upsert({
      module_id: moduleId,
      module_short_id: shortId,
      uses_schema: useSchema,
      schema_name: useSchema ? getModuleSchemaName(shortId) : null,
      table_names: tableNames,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'module_short_id'
    });
}

// ============================================================================
// SCHEMA CLEANUP
// ============================================================================

/**
 * Drop all database objects for a module (uninstall)
 * 
 * @param moduleId - The full UUID of the module
 * @param useSchema - Whether the module uses schema isolation
 * @returns Result of the drop operation
 */
export async function dropModuleDatabase(
  moduleId: string,
  useSchema?: boolean
): Promise<DropResult> {
  const supabase = createAdminClient() as UntypedSupabase;
  const shortId = generateModuleShortId(moduleId);
  
  const result: DropResult = {
    success: false,
    droppedTables: [],
  };
  
  try {
    // If useSchema not specified, check the registry
    if (useSchema === undefined) {
      const { data: registry } = await supabase
        .from('module_database_registry')
        .select('uses_schema')
        .eq('module_short_id', shortId)
        .maybeSingle();
      
      useSchema = registry?.uses_schema ?? false;
    }
    
    if (useSchema) {
      // Drop entire schema (cascades to all tables)
      const schemaName = getModuleSchemaName(shortId);
      await supabase.rpc('exec_sql', {
        sql: `DROP SCHEMA IF EXISTS ${schemaName} CASCADE;`
      });
      result.droppedSchema = schemaName;
    } else {
      // Find and drop all tables with this module's prefix
      const { data: tables } = await supabase.rpc('get_module_tables', {
        prefix: `mod_${shortId}_`
      });
      
      for (const table of (tables as any[]) || []) {
        await supabase.rpc('exec_sql', {
          sql: `DROP TABLE IF EXISTS ${table.table_name} CASCADE;`
        });
        result.droppedTables.push(table.table_name);
      }
    }
    
    // Remove from registry
    await supabase
      .from('module_database_registry')
      .delete()
      .eq('module_short_id', shortId);
    
    result.success = true;
    return result;
    
  } catch (error: unknown) {
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

/**
 * Get information about a module's database objects
 */
export async function getModuleDatabaseInfo(
  moduleId: string
): Promise<{
  shortId: string;
  usesSchema: boolean;
  schemaName?: string;
  tables: string[];
  registered: boolean;
}> {
  const supabase = createAdminClient() as UntypedSupabase;
  const shortId = generateModuleShortId(moduleId);
  
  const { data: registry } = await supabase
    .from('module_database_registry')
    .select('*')
    .eq('module_short_id', shortId)
    .maybeSingle();
  
  if (registry) {
    return {
      shortId,
      usesSchema: registry.uses_schema,
      schemaName: registry.schema_name ?? undefined,
      tables: registry.table_names || [],
      registered: true,
    };
  }
  
  // Not registered, but let's check if there are any tables
  const { data: tables } = await supabase.rpc('get_module_tables', {
    prefix: `mod_${shortId}_`
  });
  
  return {
    shortId,
    usesSchema: false,
    tables: ((tables as any[]) || []).map((t) => t.table_name),
    registered: false,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  generateModuleShortId,
  getModuleSchemaName,
  getModuleTableName,
  getModuleIndexName,
  sanitizeTableName,
  isValidShortId,
  validateModuleTableNames,
  shouldUseSchema,
} from './module-naming';
