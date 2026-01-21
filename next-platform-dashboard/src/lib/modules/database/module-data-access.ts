/**
 * Module Data Access Layer
 * 
 * Phase EM-11: Database Per Module (Multi-Tenant Data Isolation)
 * 
 * Provides a scoped interface for modules to access their own database tables.
 * Ensures:
 * - Modules can only access their own tables
 * - Site isolation is enforced on all operations
 * - Clean API for CRUD operations
 * 
 * @see phases/enterprise-modules/PHASE-EM-11-DATABASE-PER-MODULE.md
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { createClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  generateModuleShortId, 
  getModuleSchemaName,
  getModuleTableName
} from '../module-naming';

// =============================================================
// TYPES
// =============================================================

export interface ModuleDataContext {
  moduleId: string;
  siteId: string;
  userId?: string;
}

export interface QueryOptions {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export interface FilterOperators {
  eq?: string | number | boolean;
  neq?: string | number | boolean;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  like?: string;
  ilike?: string;
  in?: (string | number)[];
  is?: null | boolean;
}

export type WhereClause = Record<string, string | number | boolean | null | FilterOperators | (string | number)[]>;

// =============================================================
// MODULE DATA CLIENT (Browser/Client-side)
// =============================================================

/**
 * Create a data access client for a specific module
 * This provides a scoped interface to the module's tables
 * 
 * @param context - Module context with moduleId, siteId, and optional userId
 * @returns A client with CRUD methods for module tables
 */
export function createModuleDataClient(context: ModuleDataContext) {
  // Cast to any to allow dynamic table names not in the generated types
  const supabase = createClient() as any;
  const shortId = generateModuleShortId(context.moduleId);
  const schemaName = getModuleSchemaName(shortId);
  
  /**
   * Get the full table name for this module
   */
  function getFullTableName(tableName: string): string {
    // For schema-based isolation (when supported by Supabase)
    // Currently uses table prefix approach
    return getModuleTableName(shortId, tableName, false);
  }
  
  /**
   * Apply where filters to a query
   */
  function applyFilters<T>(query: T, filters: WhereClause): T {
    let q = query as any;
    
    for (const [key, value] of Object.entries(filters)) {
      if (value === null) {
        q = q.is(key, null);
      } else if (Array.isArray(value)) {
        q = q.in(key, value);
      } else if (typeof value === 'object') {
        // Handle operators
        const ops = value as FilterOperators;
        if (ops.eq !== undefined) q = q.eq(key, ops.eq);
        if (ops.neq !== undefined) q = q.neq(key, ops.neq);
        if (ops.gt !== undefined) q = q.gt(key, ops.gt);
        if (ops.gte !== undefined) q = q.gte(key, ops.gte);
        if (ops.lt !== undefined) q = q.lt(key, ops.lt);
        if (ops.lte !== undefined) q = q.lte(key, ops.lte);
        if (ops.like !== undefined) q = q.like(key, ops.like);
        if (ops.ilike !== undefined) q = q.ilike(key, ops.ilike);
        if (ops.in !== undefined) q = q.in(key, ops.in);
        if (ops.is !== undefined) q = q.is(key, ops.is);
      } else {
        q = q.eq(key, value);
      }
    }
    
    return q;
  }
  
  return {
    /**
     * Query a module table with automatic site filtering
     */
    from(tableName: string) {
      const fullTableName = getFullTableName(tableName);
      
      // Start query with site filtering
      return supabase
        .from(fullTableName)
        .select('*')
        .eq('site_id', context.siteId);
    },
    
    /**
     * Select with custom columns and filters
     */
    async select<T = any>(
      tableName: string,
      options?: {
        columns?: string;
        where?: WhereClause;
        orderBy?: { column: string; ascending?: boolean };
        limit?: number;
        offset?: number;
      }
    ): Promise<{ data: T[] | null; error: Error | null }> {
      const fullTableName = getFullTableName(tableName);
      
      let query = supabase
        .from(fullTableName)
        .select(options?.columns || '*')
        .eq('site_id', context.siteId);
      
      // Apply where filters
      if (options?.where) {
        query = applyFilters(query, options.where);
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
      return { data: data as T[] | null, error };
    },
    
    /**
     * Insert into a module table with automatic site_id
     */
    async insert<T = any>(
      tableName: string, 
      data: Record<string, any> | Record<string, any>[]
    ): Promise<{ data: T[] | null; error: Error | null }> {
      const fullTableName = getFullTableName(tableName);
      const records = Array.isArray(data) ? data : [data];
      
      // Ensure site_id is set on all records
      const withSiteId = records.map(r => ({
        ...r,
        site_id: r.site_id || context.siteId
      }));
      
      const { data: result, error } = await supabase
        .from(fullTableName)
        .insert(withSiteId)
        .select();
      
      return { data: result as T[] | null, error };
    },
    
    /**
     * Update records in a module table
     */
    async update<T = any>(
      tableName: string,
      data: Record<string, any>,
      where: WhereClause
    ): Promise<{ data: T[] | null; error: Error | null }> {
      const fullTableName = getFullTableName(tableName);
      
      let query = supabase
        .from(fullTableName)
        .update(data)
        .eq('site_id', context.siteId);
      
      // Apply additional filters
      query = applyFilters(query, where);
      
      const { data: result, error } = await query.select();
      return { data: result as T[] | null, error };
    },
    
    /**
     * Upsert (insert or update) records
     */
    async upsert<T = any>(
      tableName: string,
      data: Record<string, any> | Record<string, any>[],
      options?: { onConflict?: string }
    ): Promise<{ data: T[] | null; error: Error | null }> {
      const fullTableName = getFullTableName(tableName);
      const records = Array.isArray(data) ? data : [data];
      
      // Ensure site_id is set
      const withSiteId = records.map(r => ({
        ...r,
        site_id: r.site_id || context.siteId
      }));
      
      const { data: result, error } = await supabase
        .from(fullTableName)
        .upsert(withSiteId, { onConflict: options?.onConflict })
        .select();
      
      return { data: result as T[] | null, error };
    },
    
    /**
     * Delete records from a module table
     */
    async delete(
      tableName: string, 
      where: WhereClause
    ): Promise<{ count: number | null; error: Error | null }> {
      const fullTableName = getFullTableName(tableName);
      
      let query = supabase
        .from(fullTableName)
        .delete()
        .eq('site_id', context.siteId);
      
      query = applyFilters(query, where);
      
      const { error, count } = await query;
      return { count, error };
    },
    
    /**
     * Count records matching a filter
     */
    async count(
      tableName: string, 
      where?: WhereClause
    ): Promise<{ count: number | null; error: Error | null }> {
      const fullTableName = getFullTableName(tableName);
      
      let query = supabase
        .from(fullTableName)
        .select('*', { count: 'exact', head: true })
        .eq('site_id', context.siteId);
      
      if (where) {
        query = applyFilters(query, where);
      }
      
      const { error, count } = await query;
      return { count, error };
    },
    
    /**
     * Get the schema name for this module
     */
    getSchemaName() {
      return schemaName;
    },
    
    /**
     * Get the full table name with prefix
     */
    getTableName(tableName: string) {
      return getFullTableName(tableName);
    },
    
    /**
     * Get the module short ID
     */
    getShortId() {
      return shortId;
    }
  };
}

// =============================================================
// MODULE ADMIN CLIENT (Server-side only)
// =============================================================

/**
 * Server-side admin data client (bypasses RLS)
 * Use only in server actions and API routes
 * 
 * @param moduleId - The module UUID
 * @returns Admin client with full access to module tables
 */
export function createModuleAdminClient(moduleId: string) {
  // Cast to any to allow dynamic table names and RPC calls
  const supabase = createAdminClient() as any;
  const shortId = generateModuleShortId(moduleId);
  const schemaName = getModuleSchemaName(shortId);
  
  function getFullTableName(tableName: string): string {
    return getModuleTableName(shortId, tableName, false);
  }
  
  return {
    /**
     * Access a table directly (no site filtering)
     */
    from(tableName: string) {
      const fullTableName = getFullTableName(tableName);
      return supabase.from(fullTableName);
    },
    
    /**
     * Execute a raw DDL command
     */
    async executeDDL(sql: string) {
      return supabase.rpc('exec_ddl', { ddl_command: sql });
    },
    
    /**
     * Execute raw SQL (via exec_sql function)
     */
    async executeSQL(sql: string) {
      return supabase.rpc('exec_sql', { sql });
    },
    
    /**
     * Get all data for a site (admin use)
     */
    async getSiteData<T = any>(tableName: string, siteId: string) {
      const fullTableName = getFullTableName(tableName);
      return supabase
        .from(fullTableName)
        .select('*')
        .eq('site_id', siteId);
    },
    
    /**
     * Bulk delete all data for a site
     */
    async deleteSiteData(tableName: string, siteId: string) {
      const fullTableName = getFullTableName(tableName);
      return supabase
        .from(fullTableName)
        .delete()
        .eq('site_id', siteId);
    },
    
    /**
     * Get the schema name
     */
    getSchemaName() {
      return schemaName;
    },
    
    /**
     * Get full table name
     */
    getTableName(tableName: string) {
      return getFullTableName(tableName);
    }
  };
}

// =============================================================
// TYPE EXPORTS
// =============================================================

export type ModuleDataClient = ReturnType<typeof createModuleDataClient>;
export type ModuleAdminClient = ReturnType<typeof createModuleAdminClient>;
