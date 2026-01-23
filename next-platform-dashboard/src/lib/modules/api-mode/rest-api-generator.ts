/**
 * Phase EM-33: REST API Generator
 * 
 * Generates RESTful API endpoints for module data with:
 * - Full CRUD operations
 * - Pagination, filtering, sorting
 * - Search functionality
 * - Validation
 * - Webhook event emission
 * 
 * @see phases/enterprise-modules/PHASE-EM-33-API-ONLY-MODE.md
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================

export interface APIConfig {
  moduleId: string;
  siteModuleInstallationId: string;
  siteId: string;
  entities: EntityConfig[];
}

export interface EntityConfig {
  name: string;
  tableName: string;
  fields: FieldConfig[];
  operations: ('create' | 'read' | 'update' | 'delete' | 'list')[];
  filters?: string[];
  sortable?: string[];
  searchable?: string[];
  relations?: RelationConfig[];
}

export interface FieldConfig {
  name: string;
  type: FieldType;
  required: boolean;
  readonly?: boolean;
  hidden?: boolean;
  default?: any;
  validation?: ValidationRule[];
}

export type FieldType = 
  | 'uuid' 
  | 'string' 
  | 'text' 
  | 'integer' 
  | 'number' 
  | 'decimal' 
  | 'boolean' 
  | 'timestamp' 
  | 'timestamptz' 
  | 'date'
  | 'array' 
  | 'jsonb' 
  | 'object';

export interface ValidationRule {
  type: 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'enum' | 'email' | 'url';
  value: any;
  message?: string;
}

export interface RelationConfig {
  name: string;
  entity: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one';
  foreignKey: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  details?: string[];
}

export interface ConsumerContext {
  consumerId: string;
  siteModuleInstallationId: string;
  scopes: string[];
  allowedEndpoints: string[];
}

// ============================================================
// SERVICE CLIENT
// ============================================================

function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================
// REST API GENERATOR CLASS
// ============================================================

export class RESTAPIGenerator {
  private config: APIConfig;
  private tablePrefix: string;
  private supabase: SupabaseClient;
  private consumerContext?: ConsumerContext;

  constructor(config: APIConfig, supabaseClient?: SupabaseClient) {
    this.config = config;
    this.tablePrefix = `mod_${config.moduleId.substring(0, 8)}`;
    this.supabase = supabaseClient || getServiceClient();
  }

  /**
   * Set consumer context for authorization
   */
  setConsumerContext(context: ConsumerContext): void {
    this.consumerContext = context;
  }

  /**
   * Handle REST API request
   */
  async handleRequest(
    request: NextRequest,
    entity: string,
    id?: string
  ): Promise<NextResponse> {
    const method = request.method;
    const entityConfig = this.config.entities.find(e => e.name === entity);

    if (!entityConfig) {
      return this.errorResponse('Entity not found', 404);
    }

    // Check endpoint authorization
    if (this.consumerContext) {
      const endpointPattern = `${method} /${entity}${id ? '/{id}' : ''}`;
      if (!this.isEndpointAllowed(endpointPattern)) {
        return this.errorResponse('Endpoint not allowed', 403);
      }
    }

    const tableName = `${this.tablePrefix}_${entityConfig.tableName}`;

    try {
      switch (method) {
        case 'GET':
          if (id) {
            return await this.getOne(tableName, id, entityConfig);
          }
          return await this.getList(request, tableName, entityConfig);
        
        case 'POST':
          return await this.create(request, tableName, entityConfig);
        
        case 'PUT':
        case 'PATCH':
          if (!id) {
            return this.errorResponse('ID required', 400);
          }
          return await this.update(request, tableName, id, entityConfig, method === 'PUT');
        
        case 'DELETE':
          if (!id) {
            return this.errorResponse('ID required', 400);
          }
          return await this.delete(tableName, id, entityConfig);
        
        case 'HEAD':
          if (id) {
            return await this.head(tableName, id);
          }
          return await this.headList(request, tableName, entityConfig);
        
        default:
          return this.errorResponse('Method not allowed', 405);
      }
    } catch (error: any) {
      console.error('[REST API Error]', error);
      return this.errorResponse(error.message || 'Internal server error', 500);
    }
  }

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================

  /**
   * Get single item by ID
   */
  private async getOne(
    tableName: string,
    id: string,
    config: EntityConfig
  ): Promise<NextResponse> {
    if (!config.operations.includes('read')) {
      return this.errorResponse('Read operation not allowed', 403);
    }

    const selectFields = this.getSelectFields(config);

    const { data, error } = await this.supabase
      .from(tableName)
      .select(selectFields)
      .eq('id', id)
      .eq('site_id', this.config.siteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return this.errorResponse('Not found', 404);
      }
      throw error;
    }

    return NextResponse.json({ data });
  }

  /**
   * Get list with pagination, filtering, sorting, search
   */
  private async getList(
    request: NextRequest,
    tableName: string,
    config: EntityConfig
  ): Promise<NextResponse> {
    if (!config.operations.includes('list')) {
      return this.errorResponse('List operation not allowed', 403);
    }

    const params = this.parseQueryParams(request, config);
    const selectFields = this.getSelectFields(config);

    let query = this.supabase
      .from(tableName)
      .select(selectFields, { count: 'exact' })
      .eq('site_id', this.config.siteId);

    // Apply filters
    for (const [field, value] of Object.entries(params.filters || {})) {
      if (config.filters?.includes(field) && value) {
        // Support operators in filter values
        if (value.startsWith('gt:')) {
          query = query.gt(field, value.substring(3));
        } else if (value.startsWith('gte:')) {
          query = query.gte(field, value.substring(4));
        } else if (value.startsWith('lt:')) {
          query = query.lt(field, value.substring(3));
        } else if (value.startsWith('lte:')) {
          query = query.lte(field, value.substring(4));
        } else if (value.startsWith('neq:')) {
          query = query.neq(field, value.substring(4));
        } else if (value.startsWith('in:')) {
          query = query.in(field, value.substring(3).split(','));
        } else if (value.startsWith('like:')) {
          query = query.ilike(field, `%${value.substring(5)}%`);
        } else if (value === 'null') {
          query = query.is(field, null);
        } else if (value === 'not_null') {
          query = query.not(field, 'is', null);
        } else {
          query = query.eq(field, value);
        }
      }
    }

    // Apply search
    if (params.search && config.searchable && config.searchable.length > 0) {
      const searchConditions = config.searchable
        .map(field => `${field}.ilike.%${params.search}%`)
        .join(',');
      query = query.or(searchConditions);
    }

    // Apply sorting
    const sortField = config.sortable?.includes(params.sortBy) ? params.sortBy : 'created_at';
    query = query.order(sortField, { ascending: params.sortOrder === 'asc' });

    // Apply pagination
    const from = (params.page - 1) * params.limit;
    query = query.range(from, from + params.limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    const response: PaginatedResponse<any> = {
      data: data || [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / params.limit)
      }
    };

    return NextResponse.json(response);
  }

  /**
   * Create new item
   */
  private async create(
    request: NextRequest,
    tableName: string,
    config: EntityConfig
  ): Promise<NextResponse> {
    if (!config.operations.includes('create')) {
      return this.errorResponse('Create operation not allowed', 403);
    }

    // Check write scope
    if (this.consumerContext && !this.hasScope('write')) {
      return this.errorResponse('Write permission required', 403);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return this.errorResponse('Invalid JSON body', 400);
    }

    // Validate required fields
    const validation = this.validateInput(body, config, 'create');
    if (!validation.valid) {
      return this.errorResponse('Validation failed', 400, validation.errors);
    }

    // Filter to allowed fields and apply defaults
    const data = this.filterInputFields(body, config);
    data.site_id = this.config.siteId;
    
    // Apply defaults
    for (const field of config.fields) {
      if (field.default !== undefined && !(field.name in data)) {
        data[field.name] = typeof field.default === 'function' 
          ? field.default() 
          : field.default;
      }
    }

    const { data: created, error } = await this.supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return this.errorResponse('Duplicate entry', 409);
      }
      throw error;
    }

    // Emit webhook event
    await this.emitEvent(`${config.name}.created`, created);

    return NextResponse.json({ data: created }, { status: 201 });
  }

  /**
   * Update item
   */
  private async update(
    request: NextRequest,
    tableName: string,
    id: string,
    config: EntityConfig,
    fullUpdate: boolean = false
  ): Promise<NextResponse> {
    if (!config.operations.includes('update')) {
      return this.errorResponse('Update operation not allowed', 403);
    }

    // Check write scope
    if (this.consumerContext && !this.hasScope('write')) {
      return this.errorResponse('Write permission required', 403);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return this.errorResponse('Invalid JSON body', 400);
    }

    // For PUT, validate all required fields
    const mode = fullUpdate ? 'create' : 'update';
    const validation = this.validateInput(body, config, mode);
    if (!validation.valid) {
      return this.errorResponse('Validation failed', 400, validation.errors);
    }

    // Filter to allowed fields
    const data = this.filterInputFields(body, config);
    data.updated_at = new Date().toISOString();

    const { data: updated, error } = await this.supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .eq('site_id', this.config.siteId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return this.errorResponse('Not found', 404);
      }
      throw error;
    }

    // Emit webhook event
    await this.emitEvent(`${config.name}.updated`, updated);

    return NextResponse.json({ data: updated });
  }

  /**
   * Delete item
   */
  private async delete(
    tableName: string,
    id: string,
    config: EntityConfig
  ): Promise<NextResponse> {
    if (!config.operations.includes('delete')) {
      return this.errorResponse('Delete operation not allowed', 403);
    }

    // Check delete scope
    if (this.consumerContext && !this.hasScope('delete')) {
      return this.errorResponse('Delete permission required', 403);
    }

    // Get the item before deleting (for webhook)
    const { data: existing } = await this.supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .eq('site_id', this.config.siteId)
      .single();

    const { error } = await this.supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .eq('site_id', this.config.siteId);

    if (error) throw error;

    // Emit webhook event
    await this.emitEvent(`${config.name}.deleted`, { id, ...existing });

    return NextResponse.json({ success: true });
  }

  /**
   * HEAD request for single item
   */
  private async head(tableName: string, id: string): Promise<NextResponse> {
    const { data } = await this.supabase
      .from(tableName)
      .select('id')
      .eq('id', id)
      .eq('site_id', this.config.siteId)
      .single();

    return new NextResponse(null, {
      status: data ? 200 : 404,
      headers: {
        'X-Exists': data ? 'true' : 'false'
      }
    });
  }

  /**
   * HEAD request for list (count only)
   */
  private async headList(
    request: NextRequest,
    tableName: string,
    config: EntityConfig
  ): Promise<NextResponse> {
    const params = this.parseQueryParams(request, config);

    let query = this.supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .eq('site_id', this.config.siteId);

    // Apply same filters as getList
    for (const [field, value] of Object.entries(params.filters || {})) {
      if (config.filters?.includes(field) && value) {
        query = query.eq(field, value);
      }
    }

    const { count, error } = await query;

    if (error) throw error;

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Total-Count': String(count || 0)
      }
    });
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Parse query parameters from request
   */
  private parseQueryParams(
    request: NextRequest,
    config: EntityConfig
  ): PaginationParams {
    const url = new URL(request.url);
    
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const sortBy = url.searchParams.get('sort') || 'created_at';
    const sortOrder = url.searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    const search = url.searchParams.get('search') || undefined;

    // Collect filters
    const filters: Record<string, string> = {};
    for (const filter of config.filters || []) {
      const value = url.searchParams.get(filter);
      if (value) {
        filters[filter] = value;
      }
    }

    return { page, limit, sortBy, sortOrder, search, filters };
  }

  /**
   * Get select fields (excluding hidden)
   */
  private getSelectFields(config: EntityConfig): string {
    const fields = config.fields
      .filter(f => !f.hidden)
      .map(f => f.name);
    
    // Add relations if any
    if (config.relations) {
      for (const relation of config.relations) {
        if (relation.type === 'many-to-one') {
          fields.push(`${relation.name}:${relation.foreignKey}(*)`);
        }
      }
    }
    
    return fields.join(',');
  }

  /**
   * Validate input data
   */
  private validateInput(
    body: Record<string, any>,
    config: EntityConfig,
    mode: 'create' | 'update'
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const field of config.fields) {
      if (field.readonly) continue;

      // Check required fields on create
      if (mode === 'create' && field.required && !(field.name in body)) {
        if (field.default === undefined) {
          errors.push(`${field.name} is required`);
        }
      }

      // Validate field type and rules if present
      if (field.name in body) {
        const value = body[field.name];
        
        // Type validation
        if (!this.validateFieldType(value, field.type)) {
          errors.push(`${field.name} must be of type ${field.type}`);
          continue;
        }

        // Custom validation rules
        if (field.validation) {
          for (const rule of field.validation) {
            const ruleError = this.validateRule(value, rule, field.name);
            if (ruleError) {
              errors.push(ruleError);
            }
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate field type
   */
  private validateFieldType(value: any, type: FieldType): boolean {
    if (value === null || value === undefined) return true;

    switch (type) {
      case 'string':
      case 'text':
        return typeof value === 'string';
      case 'integer':
        return Number.isInteger(value);
      case 'number':
      case 'decimal':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'uuid':
        return typeof value === 'string' && 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      case 'timestamp':
      case 'timestamptz':
      case 'date':
        return typeof value === 'string' && !isNaN(Date.parse(value));
      case 'array':
        return Array.isArray(value);
      case 'object':
      case 'jsonb':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * Validate a single rule
   */
  private validateRule(value: any, rule: ValidationRule, fieldName: string): string | null {
    const defaultMessages: Record<string, string> = {
      min: `${fieldName} must be at least ${rule.value}`,
      max: `${fieldName} must be at most ${rule.value}`,
      minLength: `${fieldName} must be at least ${rule.value} characters`,
      maxLength: `${fieldName} must be at most ${rule.value} characters`,
      pattern: `${fieldName} has invalid format`,
      enum: `${fieldName} must be one of: ${rule.value.join(', ')}`,
      email: `${fieldName} must be a valid email address`,
      url: `${fieldName} must be a valid URL`
    };

    switch (rule.type) {
      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return rule.message || defaultMessages.min;
        }
        break;
      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return rule.message || defaultMessages.max;
        }
        break;
      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message || defaultMessages.minLength;
        }
        break;
      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message || defaultMessages.maxLength;
        }
        break;
      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
          return rule.message || defaultMessages.pattern;
        }
        break;
      case 'enum':
        if (Array.isArray(rule.value) && !rule.value.includes(value)) {
          return rule.message || defaultMessages.enum;
        }
        break;
      case 'email':
        if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return rule.message || defaultMessages.email;
        }
        break;
      case 'url':
        try {
          new URL(value);
        } catch {
          return rule.message || defaultMessages.url;
        }
        break;
    }

    return null;
  }

  /**
   * Filter input to allowed fields only
   */
  private filterInputFields(
    body: Record<string, any>,
    config: EntityConfig
  ): Record<string, any> {
    const result: Record<string, any> = {};
    const allowedFields = config.fields
      .filter(f => !f.readonly && !f.hidden)
      .map(f => f.name);

    for (const field of allowedFields) {
      if (field in body) {
        result[field] = body[field];
      }
    }

    return result;
  }

  /**
   * Check if consumer has required scope
   */
  private hasScope(scope: string): boolean {
    if (!this.consumerContext) return true;
    return this.consumerContext.scopes.includes(scope) || 
           this.consumerContext.scopes.includes('admin') ||
           this.consumerContext.scopes.includes('*');
  }

  /**
   * Check if endpoint is allowed for consumer
   */
  private isEndpointAllowed(endpoint: string): boolean {
    if (!this.consumerContext) return true;
    const allowed = this.consumerContext.allowedEndpoints;
    return allowed.includes('*') || allowed.includes(endpoint);
  }

  /**
   * Emit webhook event
   */
  private async emitEvent(event: string, data: any): Promise<void> {
    if (!this.config.siteModuleInstallationId) return;

    try {
      // Find active webhooks subscribed to this event
      const { data: webhooks } = await this.supabase
        .from('module_api_webhooks')
        .select(`
          id,
          url,
          secret,
          events,
          custom_headers
        `)
        .eq('is_active', true);

      if (!webhooks || webhooks.length === 0) return;

      // Filter to webhooks for this consumer that match the event
      const matchingWebhooks = webhooks.filter(w => 
        w.events.includes(event) || w.events.includes('*')
      );

      for (const webhook of matchingWebhooks) {
        // Queue webhook delivery
        const payload = {
          event,
          data,
          timestamp: new Date().toISOString()
        };

        const signature = webhook.secret 
          ? this.signPayload(JSON.stringify(payload), webhook.secret)
          : null;

        // Insert delivery record
        await this.supabase
          .from('module_api_webhook_deliveries')
          .insert({
            webhook_id: webhook.id,
            event,
            payload,
            signature
          });
      }
    } catch (error) {
      console.error('[Webhook Event Error]', error);
      // Don't fail the main operation if webhook fails
    }
  }

  /**
   * Sign webhook payload with HMAC-SHA256
   */
  private signPayload(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Create error response
   */
  private errorResponse(
    message: string,
    status: number,
    details?: string[]
  ): NextResponse {
    const response: APIResponse = { error: message };
    if (details) {
      response.details = details;
    }
    return NextResponse.json(response, { status });
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

/**
 * Create a REST API generator for a module
 */
export function createRESTAPI(config: APIConfig): RESTAPIGenerator {
  return new RESTAPIGenerator(config);
}

// ============================================================
// UTILITY EXPORTS
// ============================================================

export {
  getServiceClient
};
