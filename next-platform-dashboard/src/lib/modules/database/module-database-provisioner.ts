/**
 * Module Database Provisioner
 * 
 * Phase EM-10: Database provisioning for modules with database capabilities
 * 
 * This module handles:
 * - Creating module tables with proper prefixes
 * - Setting up RLS policies
 * - Creating indexes and triggers
 * - Deprovisioning when modules are deleted
 * 
 * IMPORTANT: This file only contains the provisioning logic and type definitions.
 * The actual database operations are delegated to EM-11 for full implementation.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/auth/permissions'
import type { 
  ModuleTable, 
  ModuleResources, 
  RLSPolicy,
  ColumnDefinition,
  ColumnType,
  DatabaseIsolation
} from '../types/module-types-v2'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedSupabaseClient = any

// =============================================================
// TYPES
// =============================================================

export interface ProvisionResult {
  success: boolean
  error?: string
  tables_created?: string[]
  schemas_created?: string[]
  buckets_created?: string[]
}

export interface DeprovisionResult {
  success: boolean
  error?: string
  tables_dropped?: string[]
  schemas_dropped?: string[]
}

interface ModuleInfo {
  id: string
  short_id: string
  db_isolation: DatabaseIsolation
  resources: ModuleResources | null
}

// =============================================================
// MAIN PROVISIONING FUNCTIONS
// =============================================================

/**
 * Provision database resources for a module
 * 
 * This creates:
 * - Tables with proper naming (mod_{short_id}_{table} or mod_{short_id}.{table})
 * - RLS policies for each table
 * - Indexes
 * - Triggers (updated_at, etc.)
 */
export async function provisionModuleDatabase(
  moduleId: string,
  resources: ModuleResources,
  dbIsolation: DatabaseIsolation = 'tables'
): Promise<ProvisionResult> {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Super admin required' }
  }

  if (!resources.tables || resources.tables.length === 0) {
    return { success: true, tables_created: [] }
  }

  const supabase = await createClient()
  // Cast to untyped client for columns added by migration
  const db = supabase as UntypedSupabaseClient
  
  // Get module short_id
  const { data: moduleInfo, error: moduleError } = await db
    .from('module_source')
    .select('id, short_id, db_isolation')
    .eq('id', moduleId)
    .single()

  if (moduleError || !moduleInfo) {
    return { success: false, error: 'Module not found' }
  }

  const shortId = moduleInfo.short_id
  const tablesCreated: string[] = []
  const schemasCreated: string[] = []

  try {
    // If using schema isolation, create the schema first
    if (dbIsolation === 'schema') {
      const schemaName = `mod_${shortId}`
      const createSchemaSql = `CREATE SCHEMA IF NOT EXISTS ${schemaName}`
      
      const { error: schemaError } = await db.rpc('execute_ddl', { 
        sql_statement: createSchemaSql 
      })
      
      if (schemaError) {
        console.error(`Failed to create schema ${schemaName}:`, schemaError)
        return { success: false, error: `Failed to create schema: ${schemaError.message}` }
      }
      
      schemasCreated.push(schemaName)
    }

    // Create each table
    for (const table of resources.tables) {
      const fullTableName = getFullTableName(shortId, table.name, dbIsolation)
      
      // Generate CREATE TABLE SQL
      const createSql = generateCreateTableSQL(fullTableName, table)
      
      // Execute via RPC
      const { error } = await db.rpc('execute_ddl', { 
        sql_statement: createSql 
      })
      
      if (error) {
        console.error(`Failed to create table ${fullTableName}:`, error)
        // Continue with other tables
        continue
      }

      tablesCreated.push(fullTableName)

      // Enable RLS
      const rlsEnableSql = `ALTER TABLE ${fullTableName} ENABLE ROW LEVEL SECURITY`
      await db.rpc('execute_ddl', { sql_statement: rlsEnableSql })

      // Create RLS policies
      for (const policy of table.rls_policies) {
        const policySql = generateRLSPolicySQL(fullTableName, policy)
        const { error: policyError } = await db.rpc('execute_ddl', { 
          sql_statement: policySql 
        })
        if (policyError) {
          console.warn(`Failed to create policy ${policy.name}:`, policyError)
        }
      }

      // Create indexes
      for (const indexCol of table.indexes) {
        const indexName = `idx_${shortId}_${table.name}_${indexCol.replace(/,/g, '_')}`
        const indexSql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${fullTableName}(${indexCol})`
        await db.rpc('execute_ddl', { sql_statement: indexSql })
      }

      // Create updated_at trigger
      const triggerSql = `
        CREATE TRIGGER update_${shortId}_${table.name}_updated_at
          BEFORE UPDATE ON ${fullTableName}
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
      `
      await db.rpc('execute_ddl', { sql_statement: triggerSql })
    }

    // Update module_source with provisioned resources
    const updatedResources = {
      ...resources,
      tables: resources.tables.map((t, i) => ({
        ...t,
        actual_name: tablesCreated[i] || getFullTableName(shortId, t.name, dbIsolation)
      }))
    }

    await db
      .from('module_source')
      .update({
        resources: updatedResources,
        db_isolation: dbIsolation
      })
      .eq('id', moduleId)

    console.log(`[ModuleDB] Provisioned ${tablesCreated.length} tables for module ${moduleId}`)

    return { 
      success: true, 
      tables_created: tablesCreated,
      schemas_created: schemasCreated
    }

  } catch (error) {
    console.error('[ModuleDB] Provisioning error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Database provisioning failed' 
    }
  }
}

/**
 * Remove database resources when a module is deleted
 */
export async function deprovisionModuleDatabase(
  moduleId: string
): Promise<DeprovisionResult> {
  const isAdmin = await isSuperAdmin()
  if (!isAdmin) {
    return { success: false, error: 'Super admin required' }
  }

  const supabase = await createClient()
  const db = supabase as UntypedSupabaseClient

  // Get module info
  const { data: moduleInfo, error: moduleError } = await db
    .from('module_source')
    .select('id, short_id, db_isolation, resources')
    .eq('id', moduleId)
    .single()

  if (moduleError || !moduleInfo) {
    return { success: true } // Module doesn't exist, nothing to deprovision
  }

  const { short_id: shortId, db_isolation: dbIsolation, resources } = moduleInfo as ModuleInfo
  const tablesDropped: string[] = []
  const schemasDropped: string[] = []

  try {
    // If schema isolation, drop the entire schema
    if (dbIsolation === 'schema') {
      const schemaName = `mod_${shortId}`
      const { error } = await db.rpc('execute_ddl', {
        sql_statement: `DROP SCHEMA IF EXISTS ${schemaName} CASCADE`
      })
      
      if (!error) {
        schemasDropped.push(schemaName)
      }
    } else if (resources?.tables) {
      // Drop individual tables
      for (const table of resources.tables) {
        const tableName = table.actual_name || getFullTableName(shortId, table.name, dbIsolation || 'tables')
        
        const { error } = await db.rpc('execute_ddl', {
          sql_statement: `DROP TABLE IF EXISTS ${tableName} CASCADE`
        })
        
        if (!error) {
          tablesDropped.push(tableName)
        }
      }
    }

    console.log(`[ModuleDB] Deprovisioned resources for module ${moduleId}`)

    return { 
      success: true, 
      tables_dropped: tablesDropped,
      schemas_dropped: schemasDropped
    }

  } catch (error) {
    console.error('[ModuleDB] Deprovisioning error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Database deprovisioning failed'
    }
  }
}

/**
 * Check if module database is provisioned
 */
export async function isModuleDatabaseProvisioned(
  moduleId: string
): Promise<boolean> {
  const supabase = await createClient()
  const db = supabase as UntypedSupabaseClient
  
  const { data: module } = await db
    .from('module_source')
    .select('resources')
    .eq('id', moduleId)
    .single()

  if (!module?.resources?.tables) {
    return false
  }

  // Check if at least one table has actual_name set
  return module.resources.tables.some((t: ModuleTable) => t.actual_name)
}

/**
 * Get module database info
 */
export async function getModuleDatabaseInfo(
  moduleId: string
): Promise<{ tables: string[]; schema?: string } | null> {
  const supabase = await createClient()
  const db = supabase as UntypedSupabaseClient
  
  const { data: module } = await db
    .from('module_source')
    .select('short_id, db_isolation, resources')
    .eq('id', moduleId)
    .single()

  if (!module) return null

  const result: { tables: string[]; schema?: string } = { tables: [] }

  if (module.db_isolation === 'schema') {
    result.schema = `mod_${module.short_id}`
  }

  if (module.resources?.tables) {
    result.tables = module.resources.tables.map(
      (t: ModuleTable) => t.actual_name || getFullTableName(module.short_id, t.name, module.db_isolation || 'none')
    )
  }

  return result
}

// =============================================================
// SQL GENERATION HELPERS
// =============================================================

/**
 * Get the full table name with proper prefix
 */
function getFullTableName(
  shortId: string, 
  tableName: string, 
  isolation: DatabaseIsolation
): string {
  switch (isolation) {
    case 'schema':
      return `mod_${shortId}.${tableName}`
    case 'tables':
      return `mod_${shortId}_${tableName}`
    default:
      return tableName
  }
}

/**
 * Generate CREATE TABLE SQL statement
 */
function generateCreateTableSQL(tableName: string, table: ModuleTable): string {
  const columns: string[] = [
    'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    'created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
    'updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()'
  ]

  for (const [colName, def] of Object.entries(table.schema)) {
    // Skip if it's one of the auto-generated columns
    if (['id', 'created_at', 'updated_at'].includes(colName)) continue
    
    let colDef = `${colName} ${mapColumnType(def.type)}`
    
    if (!def.nullable) colDef += ' NOT NULL'
    if (def.default) colDef += ` DEFAULT ${def.default}`
    if (def.unique) colDef += ' UNIQUE'
    if (def.references) {
      colDef += ` REFERENCES ${def.references.table}(${def.references.column})`
      if (def.references.onDelete) {
        colDef += ` ON DELETE ${def.references.onDelete}`
      }
    }
    
    columns.push(colDef)
  }

  return `CREATE TABLE IF NOT EXISTS ${tableName} (
    ${columns.join(',\n    ')}
  )`
}

/**
 * Generate RLS policy SQL statement
 */
function generateRLSPolicySQL(tableName: string, policy: RLSPolicy): string {
  const policyName = `${tableName.replace(/\./g, '_')}_${policy.name}`
  
  let sql = `CREATE POLICY "${policyName}" ON ${tableName}`
  
  if (policy.action !== 'ALL') {
    sql += ` FOR ${policy.action}`
  }
  
  // Add role restriction if specified
  if (policy.roles && policy.roles.length > 0) {
    sql += ` TO ${policy.roles.join(', ')}`
  }
  
  sql += ` USING (${policy.using})`
  
  if (policy.with_check) {
    sql += ` WITH CHECK (${policy.with_check})`
  }

  return sql
}

/**
 * Map TypeScript column type to PostgreSQL type
 */
function mapColumnType(type: ColumnType): string {
  const typeMap: Record<ColumnType, string> = {
    uuid: 'UUID',
    text: 'TEXT',
    integer: 'INTEGER',
    decimal: 'DECIMAL(10, 2)',
    boolean: 'BOOLEAN',
    jsonb: 'JSONB',
    timestamp: 'TIMESTAMPTZ',
    date: 'DATE',
    time: 'TIME',
    'text[]': 'TEXT[]',
    'integer[]': 'INTEGER[]'
  }
  return typeMap[type] || 'TEXT'
}

// =============================================================
// VALIDATION HELPERS
// =============================================================

/**
 * Validate table schema before provisioning
 */
export function validateTableSchema(table: ModuleTable): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Table name validation
  if (!table.name || !/^[a-z][a-z0-9_]*$/.test(table.name)) {
    errors.push(`Invalid table name: ${table.name}. Must start with letter and contain only lowercase letters, numbers, and underscores.`)
  }

  // Reserved names check
  const reservedNames = ['profiles', 'agencies', 'sites', 'users', 'auth', 'storage']
  if (reservedNames.includes(table.name)) {
    errors.push(`Table name '${table.name}' is reserved`)
  }

  // Column validation
  for (const [colName, colDef] of Object.entries(table.schema)) {
    if (!/^[a-z][a-z0-9_]*$/.test(colName)) {
      errors.push(`Invalid column name: ${colName}`)
    }
  }

  // RLS policy validation
  for (const policy of table.rls_policies) {
    if (!policy.name || !policy.using) {
      errors.push(`Invalid RLS policy: name and using clause are required`)
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate all resources before provisioning
 */
export function validateModuleResources(resources: ModuleResources): { valid: boolean; errors: string[] } {
  const allErrors: string[] = []

  for (const table of resources.tables) {
    const { errors } = validateTableSchema(table)
    allErrors.push(...errors)
  }

  return { valid: allErrors.length === 0, errors: allErrors }
}
