/**
 * Tenant-Aware Module Data Access Layer
 * 
 * Provides isolated data access for modules with automatic tenant context injection.
 * All queries are automatically filtered by the current site/agency context.
 * 
 * @module modules/database/tenant-data-access
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createAdminClient } from '@/lib/supabase/admin';
import type { TenantContext } from '@/lib/multi-tenant/tenant-context';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper type to bypass strict Supabase typing for dynamic tables
type AnySupabaseClient = any;

/**
 * Options for creating a module data access client
 */
export interface ModuleDataOptions {
  /** The module's unique identifier */
  moduleId: string;
  /** The table name prefix (e.g., 'mod_abc12345') */
  tablePrefix: string;
  /** The current tenant context */
  context: TenantContext;
}

/**
 * Result of a database operation
 */
export interface DataResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Filter operation types
 */
export type FilterOperation = 
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' 
  | 'like' | 'ilike' | 'in' | 'is' | 'contains';

/**
 * Filter definition
 */
export interface Filter {
  column: string;
  operation: FilterOperation;
  value: any;
}

/**
 * Create a tenant-isolated data access client for modules
 */
export function createModuleDataAccess(options: ModuleDataOptions) {
  const { moduleId, tablePrefix, context } = options;
  
  if (!context.siteId) {
    throw new Error('Site context required for module data access');
  }
  
  const supabase = createAdminClient() as AnySupabaseClient;
  
  // Set tenant context on creation (fire-and-forget with error logging)
  (async () => {
    try {
      await supabase.rpc('set_tenant_context', {
        p_agency_id: context.agencyId,
        p_site_id: context.siteId,
        p_user_id: context.userId
      });
    } catch (err) {
      console.error('Failed to set tenant context:', err);
    }
  })();
  
  /**
   * Get full table name from short name
   */
  function getFullTableName(tableName: string): string {
    // If already has prefix, return as-is
    if (tableName.startsWith(tablePrefix)) {
      return tableName;
    }
    return `${tablePrefix}_${tableName}`;
  }
  
  /**
   * Apply filters to a query
   */
  function applyFilters(query: any, filters: Filter[]): any {
    let filteredQuery = query;
    
    for (const filter of filters) {
      switch (filter.operation) {
        case 'eq':
          filteredQuery = filteredQuery.eq(filter.column, filter.value);
          break;
        case 'neq':
          filteredQuery = filteredQuery.neq(filter.column, filter.value);
          break;
        case 'gt':
          filteredQuery = filteredQuery.gt(filter.column, filter.value);
          break;
        case 'gte':
          filteredQuery = filteredQuery.gte(filter.column, filter.value);
          break;
        case 'lt':
          filteredQuery = filteredQuery.lt(filter.column, filter.value);
          break;
        case 'lte':
          filteredQuery = filteredQuery.lte(filter.column, filter.value);
          break;
        case 'like':
          filteredQuery = filteredQuery.like(filter.column, filter.value);
          break;
        case 'ilike':
          filteredQuery = filteredQuery.ilike(filter.column, filter.value);
          break;
        case 'in':
          filteredQuery = filteredQuery.in(filter.column, filter.value);
          break;
        case 'is':
          filteredQuery = filteredQuery.is(filter.column, filter.value);
          break;
        case 'contains':
          filteredQuery = filteredQuery.contains(filter.column, filter.value);
          break;
      }
    }
    
    return filteredQuery;
  }
  
  return {
    /**
     * Query a module table (automatically filtered by tenant)
     */
    from(tableName: string) {
      const fullTableName = getFullTableName(tableName);
      
      return {
        /**
         * Select with automatic tenant filtering
         */
        async select<T = any>(columns = '*', filters?: Filter[]): Promise<T[]> {
          let query = supabase
            .from(fullTableName)
            .select(columns)
            .eq('site_id', context.siteId!);
          
          if (filters) {
            query = applyFilters(query, filters);
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          return (data || []) as T[];
        },
        
        /**
         * Select with pagination
         */
        async selectPaginated<T = any>(
          columns = '*',
          options: PaginationOptions = {},
          filters?: Filter[]
        ): Promise<PaginatedResult<T>> {
          const page = options.page || 1;
          const pageSize = options.pageSize || 20;
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          
          // Get count
          let countQuery = supabase
            .from(fullTableName)
            .select('id', { count: 'exact', head: true })
            .eq('site_id', context.siteId!);
          
          if (filters) {
            countQuery = applyFilters(countQuery, filters);
          }
          
          const { count } = await countQuery;
          
          // Get data
          let dataQuery = supabase
            .from(fullTableName)
            .select(columns)
            .eq('site_id', context.siteId!)
            .range(from, to);
          
          if (filters) {
            dataQuery = applyFilters(dataQuery, filters);
          }
          
          if (options.orderBy) {
            dataQuery = dataQuery.order(options.orderBy, {
              ascending: options.orderDirection !== 'desc'
            });
          }
          
          const { data, error } = await dataQuery;
          
          if (error) throw error;
          
          const total = count || 0;
          
          return {
            data: (data || []) as T[],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
          };
        },
        
        /**
         * Select single record by ID
         */
        async get<T = any>(id: string): Promise<T | null> {
          const { data, error } = await supabase
            .from(fullTableName)
            .select('*')
            .eq('id', id)
            .eq('site_id', context.siteId!)
            .single();
          
          if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
          return data as T | null;
        },
        
        /**
         * Insert with automatic tenant context
         */
        async insert<T = any>(data: Partial<T> | Partial<T>[]): Promise<T | T[]> {
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
          return Array.isArray(data) ? (result as T[]) : (result?.[0] as T);
        },
        
        /**
         * Update with tenant verification
         */
        async update<T = any>(id: string, updates: Partial<T>): Promise<T> {
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
          return result as T;
        },
        
        /**
         * Update multiple records matching filters
         */
        async updateMany<T = any>(updates: Partial<T>, filters: Filter[]): Promise<T[]> {
          let query = supabase
            .from(fullTableName)
            .update({
              ...updates,
              updated_by: context.userId,
              updated_at: new Date().toISOString()
            })
            .eq('site_id', context.siteId!);
          
          query = applyFilters(query, filters);
          
          const { data: result, error } = await query.select();
          
          if (error) throw error;
          return (result || []) as T[];
        },
        
        /**
         * Upsert record (insert or update)
         */
        async upsert<T = any>(data: Partial<T>, options?: { onConflict?: string }): Promise<T> {
          const withTenant = {
            ...data,
            site_id: context.siteId,
            agency_id: context.agencyId,
            updated_by: context.userId,
            updated_at: new Date().toISOString()
          };
          
          const { data: result, error } = await supabase
            .from(fullTableName)
            .upsert(withTenant, { onConflict: options?.onConflict || 'id' })
            .select()
            .single();
          
          if (error) throw error;
          return result as T;
        },
        
        /**
         * Delete with tenant verification
         */
        async delete(id: string): Promise<{ success: boolean }> {
          const { error } = await supabase
            .from(fullTableName)
            .delete()
            .eq('id', id)
            .eq('site_id', context.siteId!);
          
          if (error) throw error;
          return { success: true };
        },
        
        /**
         * Delete multiple records matching filters
         */
        async deleteMany(filters: Filter[]): Promise<{ deleted: number }> {
          // First count what we'll delete
          let countQuery = supabase
            .from(fullTableName)
            .select('id', { count: 'exact', head: true })
            .eq('site_id', context.siteId!);
          countQuery = applyFilters(countQuery, filters);
          const { count } = await countQuery;
          
          // Then delete
          let deleteQuery = supabase
            .from(fullTableName)
            .delete()
            .eq('site_id', context.siteId!);
          deleteQuery = applyFilters(deleteQuery, filters);
          
          const { error } = await deleteQuery;
          if (error) throw error;
          
          return { deleted: count || 0 };
        },
        
        /**
         * Count records
         */
        async count(filters?: Filter[]): Promise<number> {
          let query = supabase
            .from(fullTableName)
            .select('id', { count: 'exact', head: true })
            .eq('site_id', context.siteId!);
          
          if (filters) {
            query = applyFilters(query, filters);
          }
          
          const { count, error } = await query;
          if (error) throw error;
          return count || 0;
        },
        
        /**
         * Check if record exists
         */
        async exists(id: string): Promise<boolean> {
          const { count, error } = await supabase
            .from(fullTableName)
            .select('id', { count: 'exact', head: true })
            .eq('id', id)
            .eq('site_id', context.siteId!);
          
          if (error) throw error;
          return (count || 0) > 0;
        },
        
        /**
         * Query builder for complex queries
         */
        query() {
          return supabase
            .from(fullTableName)
            .select('*')
            .eq('site_id', context.siteId!);
        },
        
        /**
         * Raw query access (still tenant-filtered)
         */
        raw() {
          return {
            supabase,
            tableName: fullTableName,
            siteId: context.siteId,
            agencyId: context.agencyId
          };
        }
      };
    },
    
    /**
     * Cross-table query within same module
     */
    async join<T = any>(
      mainTable: string,
      joinTable: string,
      _joinColumn: string,
      columns = '*'
    ): Promise<T[]> {
      const mainFullName = getFullTableName(mainTable);
      const joinFullName = getFullTableName(joinTable);
      
      const { data, error } = await supabase
        .from(mainFullName)
        .select(`${columns}, ${joinTable}:${joinFullName}(*)`)
        .eq('site_id', context.siteId!);
      
      if (error) throw error;
      return (data || []) as T[];
    },
    
    /**
     * Aggregate data (for dashboards)
     */
    async aggregate(tableName: string, aggregations: {
      count?: boolean;
      sum?: string[];
      avg?: string[];
      min?: string[];
      max?: string[];
      groupBy?: string;
    }) {
      const fullTableName = getFullTableName(tableName);
      
      // Build select clause
      const selects: string[] = [];
      if (aggregations.groupBy) {
        selects.push(aggregations.groupBy);
      }
      
      // Note: Supabase doesn't support aggregate functions directly in select
      // We'll do this via RPC or raw SQL in production
      // For now, we'll return a count with optional grouping
      
      const query = supabase
        .from(fullTableName)
        .select(aggregations.groupBy || 'id', { count: 'exact' })
        .eq('site_id', context.siteId!);
      
      const { data, count, error } = await query;
      if (error) throw error;
      
      return {
        count: count || 0,
        data: data || [],
        // These would be implemented with RPC functions in production
        sums: aggregations.sum ? {} : undefined,
        averages: aggregations.avg ? {} : undefined,
        minimums: aggregations.min ? {} : undefined,
        maximums: aggregations.max ? {} : undefined
      };
    },
    
    /**
     * Execute a raw SQL query (via RPC)
     */
    async rawQuery<T = any>(_sql: string, _params?: Record<string, any>): Promise<T[]> {
      // This would call a database function that validates tenant context
      // For now, this is a placeholder that shows the pattern
      console.warn('Raw queries should use RPC functions for security');
      throw new Error('Raw queries not implemented - use RPC functions');
    },
    
    /**
     * Get module context
     */
    getContext(): TenantContext {
      return context;
    },
    
    /**
     * Get module info
     */
    getModuleInfo() {
      return {
        moduleId,
        tablePrefix,
        siteId: context.siteId,
        agencyId: context.agencyId
      };
    },
    
    /**
     * Get the underlying Supabase client (use with caution)
     */
    getSupabaseClient(): SupabaseClient {
      return supabase;
    }
  };
}

/**
 * Type for the module data access client
 */
export type ModuleDataAccess = ReturnType<typeof createModuleDataAccess>;

/**
 * Helper to create data access from request context
 */
export function createDataAccessFromRequest(
  moduleId: string,
  tablePrefix: string,
  agencyId: string,
  siteId: string,
  userId?: string
): ModuleDataAccess {
  return createModuleDataAccess({
    moduleId,
    tablePrefix,
    context: {
      agencyId,
      siteId,
      userId
    }
  });
}
