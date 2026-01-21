/**
 * Module Database SDK
 * 
 * Phase EM-11: Database Per Module (Multi-Tenant Data Isolation)
 * 
 * This is the primary interface that module developers use to interact 
 * with their module's database. It provides a clean, intuitive API for 
 * CRUD operations with automatic site isolation.
 * 
 * Features:
 * - Automatic site_id filtering on all operations
 * - Type-safe query builders
 * - Transaction-like batch operations
 * - Query operators (gt, lt, like, in, etc.)
 * 
 * @example
 * ```typescript
 * import { createDatabaseSDK } from '@/lib/modules/sdk/database-sdk';
 * 
 * const db = createDatabaseSDK({
 *   moduleId: 'crm-module-uuid',
 *   siteId: 'site-uuid',
 *   userId: 'current-user-uuid'
 * });
 * 
 * // Create a contact
 * const contact = await db.createOne('contacts', {
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   email: 'john@example.com'
 * });
 * 
 * // Find with filters
 * const contacts = await db.find('contacts', {
 *   where: { status: 'active', lead_score: { gte: 50 } },
 *   orderBy: { column: 'created_at', ascending: false },
 *   limit: 10
 * });
 * ```
 * 
 * @see phases/enterprise-modules/PHASE-EM-11-DATABASE-PER-MODULE.md
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { 
  createModuleDataClient, 
  type ModuleDataContext,
  type WhereClause,
  type FilterOperators
} from '../database/module-data-access';

// =============================================================
// TYPES
// =============================================================

export interface FindOptions {
  where?: WhereClause;
  select?: string[];
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  table: string;
  data?: Record<string, any> | Record<string, any>[];
  where?: WhereClause;
}

// =============================================================
// MODULE DATABASE SDK CLASS
// =============================================================

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
  
  // ===========================================================
  // FIND OPERATIONS
  // ===========================================================
  
  /**
   * Find multiple records with filters and pagination
   * 
   * @param table - The table name (without module prefix)
   * @param options - Query options (where, select, orderBy, limit, offset)
   * @returns Array of matching records
   * 
   * @example
   * ```typescript
   * const contacts = await db.find('contacts', {
   *   where: { status: 'active', lead_score: { gte: 50 } },
   *   select: ['id', 'first_name', 'last_name', 'email'],
   *   orderBy: { column: 'created_at', ascending: false },
   *   limit: 10,
   *   offset: 0
   * });
   * ```
   */
  async find<T = any>(table: string, options?: FindOptions): Promise<T[]> {
    const { data, error } = await this.client.select<T>(table, {
      columns: options?.select?.join(','),
      where: options?.where,
      orderBy: options?.orderBy,
      limit: options?.limit,
      offset: options?.offset
    });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Find a single record matching filters
   * 
   * @param table - The table name
   * @param where - Filter conditions
   * @returns The matching record or null
   */
  async findOne<T = any>(table: string, where: WhereClause): Promise<T | null> {
    const results = await this.find<T>(table, { where, limit: 1 });
    return results[0] || null;
  }
  
  /**
   * Find a record by its ID
   * 
   * @param table - The table name
   * @param id - The record's UUID
   * @returns The record or null
   */
  async findById<T = any>(table: string, id: string): Promise<T | null> {
    return this.findOne<T>(table, { id });
  }
  
  /**
   * Find records with a raw query to the underlying client
   * Use when you need more control over the query
   * 
   * @param table - The table name
   * @returns The Supabase query builder
   */
  query(table: string) {
    return this.client.from(table);
  }
  
  // ===========================================================
  // CREATE OPERATIONS
  // ===========================================================
  
  /**
   * Create one or more records
   * 
   * @param table - The table name
   * @param data - Record(s) to create
   * @returns Array of created records
   * 
   * @example
   * ```typescript
   * const contacts = await db.create('contacts', [
   *   { first_name: 'John', last_name: 'Doe' },
   *   { first_name: 'Jane', last_name: 'Smith' }
   * ]);
   * ```
   */
  async create<T = any>(
    table: string,
    data: Partial<T> | Partial<T>[]
  ): Promise<T[]> {
    const { data: result, error } = await this.client.insert<T>(
      table, 
      data as Record<string, any> | Record<string, any>[]
    );
    if (error) throw error;
    return result || [];
  }
  
  /**
   * Create a single record
   * 
   * @param table - The table name
   * @param data - Record data
   * @returns The created record
   * 
   * @example
   * ```typescript
   * const contact = await db.createOne('contacts', {
   *   first_name: 'John',
   *   last_name: 'Doe',
   *   email: 'john@example.com'
   * });
   * ```
   */
  async createOne<T = any>(table: string, data: Partial<T>): Promise<T> {
    const results = await this.create<T>(table, data);
    if (!results[0]) {
      throw new Error('Failed to create record');
    }
    return results[0];
  }
  
  // ===========================================================
  // UPDATE OPERATIONS
  // ===========================================================
  
  /**
   * Update records matching a filter
   * 
   * @param table - The table name
   * @param where - Filter conditions
   * @param data - Fields to update
   * @returns Array of updated records
   * 
   * @example
   * ```typescript
   * const updated = await db.update('contacts', 
   *   { status: 'lead' },
   *   { status: 'qualified', qualified_at: new Date().toISOString() }
   * );
   * ```
   */
  async update<T = any>(
    table: string,
    where: WhereClause,
    data: Partial<T>
  ): Promise<T[]> {
    const { data: result, error } = await this.client.update<T>(
      table, 
      data as Record<string, any>, 
      where
    );
    if (error) throw error;
    return result || [];
  }
  
  /**
   * Update a record by its ID
   * 
   * @param table - The table name
   * @param id - The record's UUID
   * @param data - Fields to update
   * @returns The updated record or null if not found
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
   * Upsert (insert or update) records
   * 
   * @param table - The table name
   * @param data - Record(s) to upsert
   * @param options - Upsert options (onConflict column)
   * @returns Array of upserted records
   */
  async upsert<T = any>(
    table: string,
    data: Partial<T> | Partial<T>[],
    options?: { onConflict?: string }
  ): Promise<T[]> {
    const { data: result, error } = await this.client.upsert<T>(
      table, 
      data as Record<string, any> | Record<string, any>[],
      options
    );
    if (error) throw error;
    return result || [];
  }
  
  // ===========================================================
  // DELETE OPERATIONS
  // ===========================================================
  
  /**
   * Delete records matching a filter
   * 
   * @param table - The table name
   * @param where - Filter conditions (required to prevent accidental mass deletes)
   * @returns Number of deleted records
   */
  async delete(table: string, where: WhereClause): Promise<number> {
    if (!where || Object.keys(where).length === 0) {
      throw new Error('Delete requires a where clause to prevent accidental mass deletion');
    }
    
    const { count, error } = await this.client.delete(table, where);
    if (error) throw error;
    return count || 0;
  }
  
  /**
   * Delete a record by its ID
   * 
   * @param table - The table name
   * @param id - The record's UUID
   * @returns true if deleted, false if not found
   */
  async deleteById(table: string, id: string): Promise<boolean> {
    const count = await this.delete(table, { id });
    return count > 0;
  }
  
  // ===========================================================
  // AGGREGATE OPERATIONS
  // ===========================================================
  
  /**
   * Count records matching a filter
   * 
   * @param table - The table name
   * @param where - Optional filter conditions
   * @returns The count of matching records
   */
  async count(table: string, where?: WhereClause): Promise<number> {
    const { count, error } = await this.client.count(table, where);
    if (error) throw error;
    return count || 0;
  }
  
  /**
   * Check if any records exist matching a filter
   * 
   * @param table - The table name
   * @param where - Filter conditions
   * @returns true if at least one record matches
   */
  async exists(table: string, where: WhereClause): Promise<boolean> {
    const result = await this.findOne(table, where);
    return result !== null;
  }
  
  // ===========================================================
  // BATCH OPERATIONS
  // ===========================================================
  
  /**
   * Execute multiple operations in sequence
   * Note: These are not true database transactions, but execute in order
   * 
   * @param operations - Array of operations to execute
   * @returns Array of results from create/update operations
   * 
   * @example
   * ```typescript
   * const results = await db.batch([
   *   { type: 'create', table: 'contacts', data: { first_name: 'John' } },
   *   { type: 'update', table: 'companies', where: { id: 'xxx' }, data: { contact_count: 1 } },
   *   { type: 'delete', table: 'temp_data', where: { expired: true } }
   * ]);
   * ```
   */
  async batch<T = any>(operations: BatchOperation[]): Promise<T[]> {
    const results: T[] = [];
    
    for (const op of operations) {
      switch (op.type) {
        case 'create':
          if (!op.data) throw new Error('Create operation requires data');
          const created = await this.create<T>(op.table, op.data as Partial<T>);
          results.push(...created);
          break;
          
        case 'update':
          if (!op.where) throw new Error('Update operation requires where clause');
          if (!op.data) throw new Error('Update operation requires data');
          // For batch updates, data should be an object not array
          const updateData = Array.isArray(op.data) ? op.data[0] : op.data;
          const updated = await this.update<T>(op.table, op.where, updateData as Partial<T>);
          results.push(...updated);
          break;
          
        case 'delete':
          if (!op.where) throw new Error('Delete operation requires where clause');
          await this.delete(op.table, op.where);
          break;
      }
    }
    
    return results;
  }
  
  // ===========================================================
  // UTILITY METHODS
  // ===========================================================
  
  /**
   * Get the module's schema name
   */
  getSchemaName(): string {
    return this.client.getSchemaName();
  }
  
  /**
   * Get the full prefixed table name
   */
  getTableName(tableName: string): string {
    return this.client.getTableName(tableName);
  }
  
  /**
   * Get the current context
   */
  getContext(): ModuleDataContext {
    return { ...this.context };
  }
}

// =============================================================
// FACTORY FUNCTION
// =============================================================

/**
 * Create a database SDK instance for a module
 * 
 * @param context - Module context (moduleId, siteId, optional userId)
 * @returns ModuleDatabaseSDK instance
 * 
 * @example
 * ```typescript
 * import { createDatabaseSDK } from '@/lib/modules/sdk/database-sdk';
 * 
 * const db = createDatabaseSDK({
 *   moduleId: 'crm-module-uuid',
 *   siteId: 'site-uuid',
 *   userId: 'user-uuid'
 * });
 * ```
 */
export function createDatabaseSDK(context: ModuleDataContext): ModuleDatabaseSDK {
  return new ModuleDatabaseSDK(context);
}

// Re-export types for convenience
export type { ModuleDataContext, WhereClause, FilterOperators };
