/**
 * @dramac/sdk - Database Client
 * 
 * Type-safe database client for Dramac modules
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ModuleContext, QueryOptions, PaginatedResult, DbResult, QueryFilter } from '../types/database';
import type { TableDefinition } from '../types/module';

/**
 * Create a type-safe database client for a module
 * 
 * @example
 * ```typescript
 * interface MyTables {
 *   items: { id: string; name: string; site_id: string };
 *   categories: { id: string; title: string; site_id: string };
 * }
 * 
 * const db = createModuleClient<MyTables>(supabase, context, 'mymodule');
 * const items = await db.from('items').select();
 * ```
 */
export function createModuleClient<T extends Record<string, Record<string, unknown>>>(
  supabase: SupabaseClient,
  context: ModuleContext,
  tablePrefix: string
) {
  return {
    /**
     * Access a table with auto-filtering by site_id
     */
    from<K extends keyof T & string>(tableName: K) {
      const fullTableName = `${tablePrefix}_${tableName}`;
      
      return {
        /**
         * Select records from the table
         */
        async select(
          columns = '*',
          options?: QueryOptions
        ): Promise<DbResult<T[K][]>> {
          let query = supabase
            .from(fullTableName)
            .select(columns)
            .eq('site_id', context.siteId);
          
          if (options?.limit) {
            query = query.limit(options.limit);
          }
          
          if (options?.offset) {
            const end = options.offset + (options.limit || 10) - 1;
            query = query.range(options.offset, end);
          }
          
          if (options?.orderBy) {
            query = query.order(options.orderBy, {
              ascending: options.orderDirection !== 'desc',
            });
          }
          
          const { data, error } = await query;
          
          return {
            data: data as T[K][] | null,
            error: error ? {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            } : null,
          };
        },
        
        /**
         * Select with pagination
         */
        async selectPaginated(
          columns = '*',
          page = 1,
          pageSize = 20,
          options?: Omit<QueryOptions, 'limit' | 'offset'>
        ): Promise<PaginatedResult<T[K]>> {
          const offset = (page - 1) * pageSize;
          
          // Get total count
          const { count } = await supabase
            .from(fullTableName)
            .select('*', { count: 'exact', head: true })
            .eq('site_id', context.siteId);
          
          const total = count || 0;
          const totalPages = Math.ceil(total / pageSize);
          
          // Get data
          const result = await this.select(columns, {
            ...options,
            limit: pageSize,
            offset,
          });
          
          return {
            data: result.data || [],
            total,
            page,
            pageSize,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          };
        },
        
        /**
         * Get a single record by ID
         */
        async get(id: string): Promise<DbResult<T[K]>> {
          const { data, error } = await supabase
            .from(fullTableName)
            .select('*')
            .eq('id', id)
            .eq('site_id', context.siteId)
            .single();
          
          return {
            data: data as T[K] | null,
            error: error ? {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            } : null,
          };
        },
        
        /**
         * Insert one or more records
         */
        async insert(
          data: Omit<T[K], 'id' | 'site_id' | 'created_at' | 'created_by'> | 
                Array<Omit<T[K], 'id' | 'site_id' | 'created_at' | 'created_by'>>
        ): Promise<DbResult<T[K][]>> {
          const records = Array.isArray(data) ? data : [data];
          const withContext = records.map((r) => ({
            ...r,
            site_id: context.siteId,
            created_by: context.userId,
          }));
          
          const { data: result, error } = await supabase
            .from(fullTableName)
            .insert(withContext)
            .select();
          
          return {
            data: result as T[K][] | null,
            error: error ? {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            } : null,
          };
        },
        
        /**
         * Update a record by ID
         */
        async update(
          id: string,
          data: Partial<Omit<T[K], 'id' | 'site_id' | 'created_at' | 'created_by'>>
        ): Promise<DbResult<T[K]>> {
          const { data: result, error } = await supabase
            .from(fullTableName)
            .update({
              ...data,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('site_id', context.siteId)
            .select()
            .single();
          
          return {
            data: result as T[K] | null,
            error: error ? {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            } : null,
          };
        },
        
        /**
         * Upsert a record (insert or update)
         */
        async upsert(
          data: Partial<T[K]> & { id?: string }
        ): Promise<DbResult<T[K]>> {
          const record = {
            ...data,
            site_id: context.siteId,
            updated_at: new Date().toISOString(),
          };
          
          if (!record.id) {
            Object.assign(record, { created_by: context.userId });
          }
          
          const { data: result, error } = await supabase
            .from(fullTableName)
            .upsert(record)
            .select()
            .single();
          
          return {
            data: result as T[K] | null,
            error: error ? {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            } : null,
          };
        },
        
        /**
         * Delete a record by ID
         */
        async delete(id: string): Promise<{ error: DbResult<never>['error'] }> {
          const { error } = await supabase
            .from(fullTableName)
            .delete()
            .eq('id', id)
            .eq('site_id', context.siteId);
          
          return {
            error: error ? {
              code: error.code,
              message: error.message,
              details: error.details,
              hint: error.hint,
            } : null,
          };
        },
        
        /**
         * Soft delete a record (sets deleted_at timestamp)
         */
        async softDelete(id: string): Promise<DbResult<T[K]>> {
          return this.update(id, {
            deleted_at: new Date().toISOString(),
          } as unknown as Partial<Omit<T[K], 'id' | 'site_id' | 'created_at' | 'created_by'>>);
        },
        
        /**
         * Count records with optional filters
         */
        async count(filters?: QueryFilter[]): Promise<number> {
          let query = supabase
            .from(fullTableName)
            .select('*', { count: 'exact', head: true })
            .eq('site_id', context.siteId);
          
          if (filters) {
            for (const filter of filters) {
              switch (filter.operator) {
                case 'eq':
                  query = query.eq(filter.column, filter.value);
                  break;
                case 'neq':
                  query = query.neq(filter.column, filter.value);
                  break;
                case 'gt':
                  query = query.gt(filter.column, filter.value);
                  break;
                case 'gte':
                  query = query.gte(filter.column, filter.value);
                  break;
                case 'lt':
                  query = query.lt(filter.column, filter.value);
                  break;
                case 'lte':
                  query = query.lte(filter.column, filter.value);
                  break;
                case 'like':
                  query = query.like(filter.column, filter.value as string);
                  break;
                case 'ilike':
                  query = query.ilike(filter.column, filter.value as string);
                  break;
                case 'in':
                  query = query.in(filter.column, filter.value as unknown[]);
                  break;
              }
            }
          }
          
          const { count } = await query;
          return count || 0;
        },
        
        /**
         * Check if a record exists
         */
        async exists(id: string): Promise<boolean> {
          const { count } = await supabase
            .from(fullTableName)
            .select('*', { count: 'exact', head: true })
            .eq('id', id)
            .eq('site_id', context.siteId);
          
          return (count || 0) > 0;
        },
        
        /**
         * Get raw query builder for advanced queries
         */
        query() {
          return supabase
            .from(fullTableName)
            .select('*')
            .eq('site_id', context.siteId);
        },
      };
    },
    
    /**
     * Execute raw SQL (requires admin privileges)
     */
    async raw(sql: string): Promise<DbResult<unknown>> {
      const { data, error } = await supabase.rpc('exec_ddl', {
        ddl_statement: sql,
      });
      
      return {
        data,
        error: error ? {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        } : null,
      };
    },
    
    /**
     * Get the underlying Supabase client
     */
    getClient(): SupabaseClient {
      return supabase;
    },
    
    /**
     * Get the current context
     */
    getContext(): ModuleContext {
      return context;
    },
  };
}

/**
 * Type helper for inferring table types from definitions
 */
export type InferTableType<T extends TableDefinition> = {
  [K in T['columns'][number]['name']]: unknown;
};

/**
 * Create module context from request/session
 */
export function createContext(
  moduleId: string,
  siteId: string,
  userId?: string
): ModuleContext {
  return { moduleId, siteId, userId };
}
