/**
 * @dramac/sdk - Query Builder
 * 
 * Fluent query builder for complex database queries
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ModuleContext, QueryOptions, DbResult, FilterOperator } from '../types/database';

/**
 * Fluent query builder with chainable methods
 */
export class QueryBuilder<T extends Record<string, unknown>> {
  private client: SupabaseClient;
  private context: ModuleContext;
  private tableName: string;
  private selectColumns: string = '*';
  private filters: Array<{ column: string; operator: FilterOperator; value: unknown }> = [];
  private orderByColumn?: string;
  private orderAscending: boolean = true;
  private limitCount?: number;
  private offsetCount?: number;
  private includeDeleted: boolean = false;

  constructor(client: SupabaseClient, context: ModuleContext, tableName: string) {
    this.client = client;
    this.context = context;
    this.tableName = tableName;
  }

  /**
   * Select specific columns
   */
  select(columns: string | string[]): this {
    this.selectColumns = Array.isArray(columns) ? columns.join(', ') : columns;
    return this;
  }

  /**
   * Add equality filter
   */
  where(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  /**
   * Add filter with specific operator
   */
  whereOp(column: string, operator: FilterOperator, value: unknown): this {
    this.filters.push({ column, operator, value });
    return this;
  }

  /**
   * Add not-equal filter
   */
  whereNot(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  /**
   * Add greater-than filter
   */
  whereGt(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'gt', value });
    return this;
  }

  /**
   * Add greater-than-or-equal filter
   */
  whereGte(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  /**
   * Add less-than filter
   */
  whereLt(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  /**
   * Add less-than-or-equal filter
   */
  whereLte(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  /**
   * Add LIKE filter (case-sensitive)
   */
  whereLike(column: string, pattern: string): this {
    this.filters.push({ column, operator: 'like', value: pattern });
    return this;
  }

  /**
   * Add ILIKE filter (case-insensitive)
   */
  whereILike(column: string, pattern: string): this {
    this.filters.push({ column, operator: 'ilike', value: pattern });
    return this;
  }

  /**
   * Add IN filter
   */
  whereIn(column: string, values: unknown[]): this {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  /**
   * Add IS NULL filter
   */
  whereNull(column: string): this {
    this.filters.push({ column, operator: 'is', value: null });
    return this;
  }

  /**
   * Add IS NOT NULL filter
   */
  whereNotNull(column: string): this {
    this.filters.push({ column, operator: 'neq', value: null });
    return this;
  }

  /**
   * Include soft-deleted records
   */
  withDeleted(): this {
    this.includeDeleted = true;
    return this;
  }

  /**
   * Order by column
   */
  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.orderByColumn = column;
    this.orderAscending = direction === 'asc';
    return this;
  }

  /**
   * Limit number of results
   */
  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  /**
   * Offset results (for pagination)
   */
  offset(count: number): this {
    this.offsetCount = count;
    return this;
  }

  /**
   * Execute query and get results
   */
  async get(): Promise<DbResult<T[]>> {
    let query = this.client
      .from(this.tableName)
      .select(this.selectColumns)
      .eq('site_id', this.context.siteId);

    // Exclude soft-deleted by default
    if (!this.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    // Apply filters
    query = this.applyFilters(query);

    // Apply ordering
    if (this.orderByColumn) {
      query = query.order(this.orderByColumn, { ascending: this.orderAscending });
    }

    // Apply pagination
    if (this.limitCount !== undefined) {
      query = query.limit(this.limitCount);
    }

    if (this.offsetCount !== undefined && this.limitCount !== undefined) {
      query = query.range(this.offsetCount, this.offsetCount + this.limitCount - 1);
    }

    const { data, error } = await query;

    return {
      data: data as T[] | null,
      error: error ? {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      } : null,
    };
  }

  /**
   * Get first result
   */
  async first(): Promise<DbResult<T>> {
    const result = await this.limit(1).get();
    return {
      data: result.data?.[0] ?? null,
      error: result.error,
    };
  }

  /**
   * Get count of matching records
   */
  async count(): Promise<number> {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('site_id', this.context.siteId);

    if (!this.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    query = this.applyFilters(query);

    const { count } = await query;
    return count || 0;
  }

  /**
   * Check if any matching records exist
   */
  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  /**
   * Apply filters to query
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyFilters(query: any): any {
    for (const filter of this.filters) {
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
        case 'is':
          query = query.is(filter.column, filter.value);
          break;
        case 'in':
          query = query.in(filter.column, filter.value as unknown[]);
          break;
        case 'contains':
          query = query.contains(filter.column, filter.value);
          break;
        case 'containedBy':
          query = query.containedBy(filter.column, filter.value);
          break;
        case 'overlaps':
          query = query.overlaps(filter.column, filter.value as unknown[]);
          break;
      }
    }
    return query;
  }
}

/**
 * Create a new query builder
 */
export function createQuery<T extends Record<string, unknown>>(
  client: SupabaseClient,
  context: ModuleContext,
  tableName: string
): QueryBuilder<T> {
  return new QueryBuilder<T>(client, context, tableName);
}
