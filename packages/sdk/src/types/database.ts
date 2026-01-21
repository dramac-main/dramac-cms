/**
 * @dramac/sdk - Database Types
 * 
 * TypeScript definitions for database operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Module context for database operations
 */
export interface ModuleContext {
  moduleId: string;
  siteId: string;
  userId?: string;
}

/**
 * Query options for data fetching
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Pagination result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Database operation result
 */
export interface DbResult<T> {
  data: T | null;
  error: DbError | null;
}

/**
 * Database error structure
 */
export interface DbError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

/**
 * Filter operators for queries
 */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'is'
  | 'in'
  | 'contains'
  | 'containedBy'
  | 'overlaps';

/**
 * Query filter definition
 */
export interface QueryFilter {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Batch operation result
 */
export interface BatchResult<T> {
  successful: T[];
  failed: Array<{
    data: unknown;
    error: DbError;
  }>;
  totalSuccessful: number;
  totalFailed: number;
}

/**
 * Transaction context
 */
export interface TransactionContext {
  client: SupabaseClient;
  moduleId: string;
  siteId: string;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
}

/**
 * Migration definition
 */
export interface MigrationDefinition {
  version: string;
  name: string;
  up: string;    // SQL to apply
  down: string;  // SQL to rollback
}

/**
 * Migration status
 */
export interface MigrationStatus {
  version: string;
  name: string;
  appliedAt: Date | null;
  status: 'pending' | 'applied' | 'failed';
}

/**
 * Table schema introspection result
 */
export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  primaryKey: string[];
  foreignKeys: ForeignKeySchema[];
  indexes: IndexSchema[];
}

/**
 * Column schema from introspection
 */
export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
}

/**
 * Foreign key schema from introspection
 */
export interface ForeignKeySchema {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete: string;
  onUpdate: string;
}

/**
 * Index schema from introspection
 */
export interface IndexSchema {
  name: string;
  columns: string[];
  unique: boolean;
  type: string;
}
