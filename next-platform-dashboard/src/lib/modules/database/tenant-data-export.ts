/**
 * Tenant Data Export/Import with Isolation
 * 
 * Provides data export and import functionality that respects tenant boundaries.
 * Useful for data migration, backup, and site cloning operations.
 * 
 * @module modules/database/tenant-data-export
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createAdminClient } from '@/lib/supabase/admin';
import type { TenantContext } from '@/lib/multi-tenant/tenant-context';

// Helper type to bypass strict Supabase typing for dynamic tables
type AnySupabaseClient = any;

/**
 * Export options
 */
export interface ExportOptions {
  /** Include soft-deleted records */
  includeDeleted?: boolean;
  /** Tables to exclude from export */
  excludeTables?: string[];
  /** Custom data transformations */
  transformers?: Record<string, (record: any) => any>;
}

/**
 * Import options
 */
export interface ImportOptions {
  /** Strategy for handling existing records */
  mergeStrategy: 'replace' | 'merge' | 'skip';
  /** Preserve original IDs (dangerous, may cause conflicts) */
  preserveIds?: boolean;
  /** Tables to exclude from import */
  excludeTables?: string[];
  /** Custom data transformations before import */
  transformers?: Record<string, (record: any) => any>;
  /** Dry run mode - validate without importing */
  dryRun?: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  imported: number;
  skipped: number;
  updated: number;
  errors: ImportError[];
  dryRun: boolean;
}

/**
 * Import error details
 */
export interface ImportError {
  table: string;
  record?: any;
  error: string;
}

/**
 * Clone result
 */
export interface CloneResult {
  cloned: number;
  errors: string[];
  tableResults: Record<string, { copied: number; errors: number }>;
}

/**
 * Export module data for a specific tenant
 * 
 * @param moduleId - The module to export data from
 * @param tablePrefix - The table name prefix (e.g., 'mod_abc12345')
 * @param context - The tenant context
 * @param options - Export options
 * @returns Record of table names to arrays of records
 */
export async function exportModuleData(
  moduleId: string,
  tablePrefix: string,
  context: TenantContext,
  options?: ExportOptions
): Promise<Record<string, any[]>> {
  const supabase = createAdminClient() as AnySupabaseClient;
  
  if (!context.siteId) {
    throw new Error('Site context required for data export');
  }
  
  // Get all tables for this module
  const { data: tables, error: tablesError } = await supabase
    .from('module_database_registry')
    .select('table_name')
    .eq('module_id', moduleId)
    .eq('status', 'active');
  
  if (tablesError) {
    throw new Error(`Failed to get module tables: ${tablesError.message}`);
  }
  
  if (!tables?.length) {
    return {};
  }
  
  const exportData: Record<string, any[]> = {};
  const excludeTables = options?.excludeTables || [];
  
  for (const { table_name } of tables) {
    // Skip excluded tables
    const shortName = table_name.replace(`${tablePrefix}_`, '');
    if (excludeTables.includes(shortName) || excludeTables.includes(table_name)) {
      continue;
    }
    
    // Fetch data for this table
    const { data, error } = await supabase
      .from(table_name)
      .select('*')
      .eq('site_id', context.siteId);
    
    if (error) {
      console.error(`Failed to export table ${table_name}:`, error);
      continue;
    }
    
    // Clean and transform data
    const cleanedData = (data || []).map((record: any) => {
      // Remove internal/sensitive fields
      const {
        site_id: _site_id,
        agency_id: _agency_id,
        created_by: _created_by,
        updated_by: _updated_by,
        ...rest
      } = record;
      
      // Apply custom transformer if provided
      if (options?.transformers?.[shortName]) {
        return options.transformers[shortName](rest);
      }
      
      return rest;
    });
    
    exportData[shortName] = cleanedData;
  }
  
  return exportData;
}

/**
 * Export module data as JSON string (for download)
 */
export async function exportModuleDataAsJson(
  moduleId: string,
  tablePrefix: string,
  context: TenantContext,
  options?: ExportOptions
): Promise<string> {
  const data = await exportModuleData(moduleId, tablePrefix, context, options);
  
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    moduleId,
    version: '1.0',
    data
  }, null, 2);
}

/**
 * Import module data into a tenant
 * 
 * @param moduleId - The module to import data into
 * @param tablePrefix - The table name prefix
 * @param context - The tenant context
 * @param data - Record of table names to arrays of records
 * @param options - Import options
 * @returns Import result with counts and errors
 */
export async function importModuleData(
  moduleId: string,
  tablePrefix: string,
  context: TenantContext,
  data: Record<string, any[]>,
  options: ImportOptions = { mergeStrategy: 'merge' }
): Promise<ImportResult> {
  const supabase = createAdminClient() as AnySupabaseClient;
  
  if (!context.siteId) {
    throw new Error('Site context required for data import');
  }
  
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    updated: 0,
    errors: [],
    dryRun: options.dryRun || false
  };
  
  const excludeTables = options.excludeTables || [];
  
  for (const [tableName, records] of Object.entries(data)) {
    // Skip excluded tables
    if (excludeTables.includes(tableName)) {
      continue;
    }
    
    const fullTableName = `${tablePrefix}_${tableName}`;
    
    // Verify table exists
    const { data: tableExists } = await supabase
      .from('module_database_registry')
      .select('id')
      .eq('table_name', fullTableName)
      .single();
    
    if (!tableExists) {
      result.errors.push({
        table: tableName,
        error: `Table ${fullTableName} not found in module registry`
      });
      continue;
    }
    
    try {
      // Clear existing data if replacing
      if (options.mergeStrategy === 'replace' && !options.dryRun) {
        await supabase
          .from(fullTableName)
          .delete()
          .eq('site_id', context.siteId);
      }
      
      for (const record of records) {
        try {
          // Apply custom transformer if provided
          let transformedRecord = record;
          if (options.transformers?.[tableName]) {
            transformedRecord = options.transformers[tableName](record);
          }
          
          // Add tenant context
          const recordWithTenant = {
            ...transformedRecord,
            site_id: context.siteId,
            agency_id: context.agencyId,
            created_by: context.userId
          };
          
          // Remove ID if not preserving
          if (!options.preserveIds) {
            delete recordWithTenant.id;
          }
          
          if (options.dryRun) {
            // Validate only
            result.imported++;
            continue;
          }
          
          if (options.mergeStrategy === 'skip' && record.id) {
            // Check if record exists
            const { data: existing } = await supabase
              .from(fullTableName)
              .select('id')
              .eq('id', record.id)
              .eq('site_id', context.siteId)
              .single();
            
            if (existing) {
              result.skipped++;
              continue;
            }
          }
          
          if (options.mergeStrategy === 'merge' && record.id && options.preserveIds) {
            // Upsert
            const { error } = await supabase
              .from(fullTableName)
              .upsert(recordWithTenant);
            
            if (error) throw error;
            result.updated++;
          } else {
            // Insert
            const { error } = await supabase
              .from(fullTableName)
              .insert(recordWithTenant);
            
            if (error) throw error;
            result.imported++;
          }
          
        } catch (recordError: any) {
          result.errors.push({
            table: tableName,
            record,
            error: recordError.message
          });
        }
      }
      
    } catch (tableError: any) {
      result.errors.push({
        table: tableName,
        error: `Table error: ${tableError.message}`
      });
    }
  }
  
  return result;
}

/**
 * Import module data from JSON string
 */
export async function importModuleDataFromJson(
  moduleId: string,
  tablePrefix: string,
  context: TenantContext,
  jsonString: string,
  options: ImportOptions = { mergeStrategy: 'merge' }
): Promise<ImportResult> {
  let parsed: any;
  
  try {
    parsed = JSON.parse(jsonString);
  } catch (_error) {
    return {
      imported: 0,
      skipped: 0,
      updated: 0,
      errors: [{ table: '', error: 'Invalid JSON format' }],
      dryRun: options.dryRun || false
    };
  }
  
  // Validate export format
  if (!parsed.data || typeof parsed.data !== 'object') {
    return {
      imported: 0,
      skipped: 0,
      updated: 0,
      errors: [{ table: '', error: 'Invalid export format: missing data' }],
      dryRun: options.dryRun || false
    };
  }
  
  return importModuleData(moduleId, tablePrefix, context, parsed.data, options);
}

/**
 * Clone module data between sites (within same agency)
 * 
 * @param moduleId - The module to clone
 * @param tablePrefix - The table name prefix
 * @param sourceSiteId - Source site to clone from
 * @param targetSiteId - Target site to clone to
 * @param agencyId - The agency ID (must own both sites)
 * @param userId - The user performing the clone
 * @returns Clone result
 */
export async function cloneModuleData(
  moduleId: string,
  tablePrefix: string,
  sourceSiteId: string,
  targetSiteId: string,
  agencyId: string,
  userId: string
): Promise<CloneResult> {
  const supabase = createAdminClient() as AnySupabaseClient;
  
  // Verify both sites belong to the agency
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id')
    .eq('agency_id', agencyId)
    .in('id', [sourceSiteId, targetSiteId]);
  
  if (sitesError || sites?.length !== 2) {
    return {
      cloned: 0,
      errors: ['Both sites must belong to the same agency'],
      tableResults: {}
    };
  }
  
  // Export from source
  const exportedData = await exportModuleData(moduleId, tablePrefix, {
    agencyId,
    siteId: sourceSiteId,
    userId
  });
  
  // Import to target
  const importResult = await importModuleData(
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
  
  // Build table results
  const tableResults: Record<string, { copied: number; errors: number }> = {};
  
  for (const tableName of Object.keys(exportedData)) {
    const tableErrors = importResult.errors.filter(e => e.table === tableName);
    tableResults[tableName] = {
      copied: exportedData[tableName].length - tableErrors.length,
      errors: tableErrors.length
    };
  }
  
  return {
    cloned: importResult.imported,
    errors: importResult.errors.map(e => `${e.table}: ${e.error}`),
    tableResults
  };
}

/**
 * Validate import data structure without importing
 */
export async function validateImportData(
  moduleId: string,
  tablePrefix: string,
  context: TenantContext,
  data: Record<string, any[]>
): Promise<{
  valid: boolean;
  errors: string[];
  summary: Record<string, number>;
}> {
  const result = await importModuleData(
    moduleId,
    tablePrefix,
    context,
    data,
    { mergeStrategy: 'merge', dryRun: true }
  );
  
  const summary: Record<string, number> = {};
  for (const [table, records] of Object.entries(data)) {
    summary[table] = records.length;
  }
  
  return {
    valid: result.errors.length === 0,
    errors: result.errors.map(e => `${e.table}: ${e.error}`),
    summary
  };
}

/**
 * Get export metadata without exporting data
 */
export async function getExportMetadata(
  moduleId: string,
  tablePrefix: string,
  context: TenantContext
): Promise<{
  tables: string[];
  recordCounts: Record<string, number>;
  totalRecords: number;
  estimatedSize: number;
}> {
  const supabase = createAdminClient() as AnySupabaseClient;
  
  if (!context.siteId) {
    throw new Error('Site context required');
  }
  
  // Get all tables for this module
  const { data: tables } = await supabase
    .from('module_database_registry')
    .select('table_name')
    .eq('module_id', moduleId)
    .eq('status', 'active');
  
  const tableNames: string[] = [];
  const recordCounts: Record<string, number> = {};
  let totalRecords = 0;
  
  for (const { table_name } of tables || []) {
    const shortName = table_name.replace(`${tablePrefix}_`, '');
    tableNames.push(shortName);
    
    const { count } = await supabase
      .from(table_name)
      .select('id', { count: 'exact', head: true })
      .eq('site_id', context.siteId);
    
    recordCounts[shortName] = count || 0;
    totalRecords += count || 0;
  }
  
  // Rough estimate: ~500 bytes per record average
  const estimatedSize = totalRecords * 500;
  
  return {
    tables: tableNames,
    recordCounts,
    totalRecords,
    estimatedSize
  };
}
