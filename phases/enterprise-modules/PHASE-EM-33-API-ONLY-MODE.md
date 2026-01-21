# Phase EM-33: API-Only Mode

> **Priority**: 🟡 MEDIUM
> **Estimated Time**: 10-12 hours
> **Prerequisites**: EM-12, EM-13
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Enable modules to run in **headless/API-only mode** for programmatic access:
1. REST API endpoints for all module data
2. GraphQL API option
3. Webhook event delivery
4. SDK generation for multiple languages
5. API documentation auto-generation

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      API-ONLY MODE                                   │
├────────────────┬─────────────────┬──────────────────────────────────┤
│   REST API     │   GRAPHQL       │      WEBHOOKS                    │
├────────────────┼─────────────────┼──────────────────────────────────┤
│ CRUD Endpoints │ Schema Gen      │ Event Subscriptions              │
│ Pagination     │ Query Builder   │ Delivery Queue                   │
│ Filtering      │ Mutations       │ Retry Logic                      │
│ Rate Limiting  │ Subscriptions   │ Signing                          │
└────────────────┴─────────────────┴──────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   SDK GEN    │
                    │ TS/JS/Python │
                    └──────────────┘
```

---

## 📋 Implementation Tasks

### Task 1: Database Schema (30 mins)

```sql
-- migrations/em-33-api-mode-schema.sql

-- API Consumers (Applications using the API)
CREATE TABLE module_api_consumers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_module_id UUID NOT NULL REFERENCES site_modules(id) ON DELETE CASCADE,
  
  -- Consumer info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Authentication
  api_key TEXT UNIQUE NOT NULL,          -- For simple auth
  api_secret_hash TEXT,                  -- Hashed secret for HMAC
  
  -- OAuth (optional)
  oauth_client_id UUID REFERENCES module_oauth_clients(id),
  
  -- Permissions
  scopes TEXT[] DEFAULT ARRAY['read'],   -- ['read', 'write', 'delete', 'admin']
  allowed_endpoints TEXT[] DEFAULT ARRAY['*'], -- ['GET /products', 'POST /orders']
  
  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- IP restrictions
  allowed_ips INET[],                    -- null = all allowed
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_requests BIGINT DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Request Log
CREATE TABLE module_api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID REFERENCES module_api_consumers(id),
  site_module_id UUID NOT NULL,
  
  -- Request details
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  query_params JSONB,
  request_body JSONB,
  
  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,
  response_size_bytes INTEGER,
  
  -- Client info
  ip_address INET,
  user_agent TEXT,
  
  -- Error (if any)
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GraphQL Schema Cache
CREATE TABLE module_graphql_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  
  -- Schema
  sdl TEXT NOT NULL,                     -- GraphQL SDL
  introspection_json JSONB,
  
  -- Generation
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_from JSONB                   -- Module entities used
);

-- Webhook Subscriptions (enhanced from EM-31)
CREATE TABLE module_api_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES module_api_consumers(id) ON DELETE CASCADE,
  
  -- Webhook config
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,                -- ['product.created', 'order.completed']
  
  -- Security
  secret TEXT,                           -- For signing payloads
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_consumers_site_module ON module_api_consumers(site_module_id);
CREATE INDEX idx_api_consumers_key ON module_api_consumers(api_key) WHERE is_active;
CREATE INDEX idx_api_requests_consumer ON module_api_requests(consumer_id, created_at DESC);
CREATE INDEX idx_api_requests_module ON module_api_requests(site_module_id, created_at DESC);
CREATE INDEX idx_graphql_schemas ON module_graphql_schemas(module_id, version);
CREATE INDEX idx_api_webhooks_consumer ON module_api_webhooks(consumer_id);

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'dk_' || encode(gen_random_bytes(24), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_api_rate_limit(
  p_consumer_id UUID,
  p_window_minutes INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  SELECT rate_limit_per_minute INTO v_limit
  FROM module_api_consumers
  WHERE id = p_consumer_id;
  
  SELECT COUNT(*) INTO v_count
  FROM module_api_requests
  WHERE consumer_id = p_consumer_id
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  RETURN v_count < v_limit;
END;
$$ LANGUAGE plpgsql;
```

---

### Task 2: REST API Generator (3 hours)

```typescript
// src/lib/modules/api-mode/rest-api-generator.ts

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface APIConfig {
  moduleId: string;
  siteModuleId: string;
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
}

export interface FieldConfig {
  name: string;
  type: string;
  required: boolean;
  readonly?: boolean;
  hidden?: boolean;
}

export class RESTAPIGenerator {
  private config: APIConfig;
  private tablePrefix: string;

  constructor(config: APIConfig) {
    this.config = config;
    this.tablePrefix = `mod_${config.moduleId.substring(0, 8)}`;
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
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
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
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
          }
          return await this.update(request, tableName, id, entityConfig);
        
        case 'DELETE':
          if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
          }
          return await this.delete(tableName, id);
        
        default:
          return NextResponse.json(
            { error: 'Method not allowed' },
            { status: 405 }
          );
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }

  /**
   * Get single item
   */
  private async getOne(
    tableName: string,
    id: string,
    config: EntityConfig
  ): Promise<NextResponse> {
    const selectFields = this.getSelectFields(config);

    const { data, error } = await supabase
      .from(tableName)
      .select(selectFields)
      .eq('id', id)
      .eq('site_id', this.config.siteId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ data });
  }

  /**
   * Get list with pagination, filtering, sorting
   */
  private async getList(
    request: NextRequest,
    tableName: string,
    config: EntityConfig
  ): Promise<NextResponse> {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const sortBy = url.searchParams.get('sort') || 'created_at';
    const sortOrder = url.searchParams.get('order') === 'asc' ? true : false;
    const search = url.searchParams.get('search');

    const selectFields = this.getSelectFields(config);

    let query = supabase
      .from(tableName)
      .select(selectFields, { count: 'exact' })
      .eq('site_id', this.config.siteId);

    // Apply filters
    for (const filter of config.filters || []) {
      const value = url.searchParams.get(filter);
      if (value) {
        query = query.eq(filter, value);
      }
    }

    // Apply search
    if (search && config.searchable && config.searchable.length > 0) {
      const searchConditions = config.searchable
        .map(field => `${field}.ilike.%${search}%`)
        .join(',');
      query = query.or(searchConditions);
    }

    // Apply sorting
    if (config.sortable?.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
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
      return NextResponse.json({ error: 'Create not allowed' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    const validation = this.validateInput(body, config, 'create');
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Filter to allowed fields
    const data = this.filterInputFields(body, config);
    data.site_id = this.config.siteId;

    const { data: created, error } = await supabase
      .from(tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw error;

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
    config: EntityConfig
  ): Promise<NextResponse> {
    if (!config.operations.includes('update')) {
      return NextResponse.json({ error: 'Update not allowed' }, { status: 403 });
    }

    const body = await request.json();

    // Validate fields
    const validation = this.validateInput(body, config, 'update');
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Filter to allowed fields
    const data = this.filterInputFields(body, config);
    data.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .eq('site_id', this.config.siteId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
  private async delete(tableName: string, id: string): Promise<NextResponse> {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .eq('site_id', this.config.siteId);

    if (error) throw error;

    // Emit webhook event
    await this.emitEvent(`${tableName.split('_').pop()}.deleted`, { id });

    return NextResponse.json({ success: true });
  }

  // Helper methods
  private getSelectFields(config: EntityConfig): string {
    return config.fields
      .filter(f => !f.hidden)
      .map(f => f.name)
      .join(',');
  }

  private validateInput(
    body: Record<string, any>,
    config: EntityConfig,
    mode: 'create' | 'update'
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const field of config.fields) {
      if (field.readonly) continue;

      if (mode === 'create' && field.required && !(field.name in body)) {
        errors.push(`${field.name} is required`);
      }

      if (field.name in body) {
        const value = body[field.name];
        if (!this.validateFieldType(value, field.type)) {
          errors.push(`${field.name} must be of type ${field.type}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private validateFieldType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
      case 'text':
        return typeof value === 'string';
      case 'integer':
        return Number.isInteger(value);
      case 'number':
      case 'decimal':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'uuid':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      case 'array':
        return Array.isArray(value);
      case 'object':
      case 'jsonb':
        return typeof value === 'object' && value !== null;
      default:
        return true;
    }
  }

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

  private async emitEvent(event: string, data: any): Promise<void> {
    // Find webhooks subscribed to this event
    const { data: webhooks } = await supabase
      .from('module_api_webhooks')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event]);

    if (!webhooks || webhooks.length === 0) return;

    for (const webhook of webhooks) {
      // Queue webhook delivery (async)
      fetch('/api/internal/webhook-deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookId: webhook.id,
          event,
          data,
          secret: webhook.secret
        })
      }).catch(() => {});
    }
  }
}
```

---

### Task 3: GraphQL Generator (2 hours)

```typescript
// src/lib/modules/api-mode/graphql-generator.ts

import { createClient } from '@supabase/supabase-js';
import { EntityConfig, FieldConfig } from './rest-api-generator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class GraphQLSchemaGenerator {
  private moduleId: string;
  private entities: EntityConfig[];

  constructor(moduleId: string, entities: EntityConfig[]) {
    this.moduleId = moduleId;
    this.entities = entities;
  }

  /**
   * Generate GraphQL SDL schema
   */
  generateSchema(): string {
    const typeDefinitions = this.entities.map(e => this.generateType(e)).join('\n\n');
    const queryType = this.generateQueryType();
    const mutationType = this.generateMutationType();
    const inputTypes = this.entities.map(e => this.generateInputTypes(e)).join('\n\n');
    const commonTypes = this.generateCommonTypes();

    return `
${commonTypes}

${typeDefinitions}

${inputTypes}

${queryType}

${mutationType}
`;
  }

  /**
   * Generate type definition for entity
   */
  private generateType(entity: EntityConfig): string {
    const fields = entity.fields
      .filter(f => !f.hidden)
      .map(f => `  ${f.name}: ${this.mapFieldType(f)}`)
      .join('\n');

    return `type ${this.toPascalCase(entity.name)} {
${fields}
}`;
  }

  /**
   * Generate input types for mutations
   */
  private generateInputTypes(entity: EntityConfig): string {
    const createFields = entity.fields
      .filter(f => !f.readonly && !f.hidden)
      .map(f => `  ${f.name}: ${this.mapInputType(f)}`)
      .join('\n');

    const updateFields = entity.fields
      .filter(f => !f.readonly && !f.hidden)
      .map(f => `  ${f.name}: ${this.mapFieldType(f, false)}`)
      .join('\n');

    return `input Create${this.toPascalCase(entity.name)}Input {
${createFields}
}

input Update${this.toPascalCase(entity.name)}Input {
${updateFields}
}`;
  }

  /**
   * Generate Query type
   */
  private generateQueryType(): string {
    const queries = this.entities.map(entity => {
      const name = entity.name;
      const typeName = this.toPascalCase(name);
      
      let queries = [];
      
      if (entity.operations.includes('read')) {
        queries.push(`  ${name}(id: ID!): ${typeName}`);
      }
      
      if (entity.operations.includes('list')) {
        queries.push(`  ${name}s(
    page: Int = 1
    limit: Int = 20
    sort: String
    order: SortOrder = DESC
    search: String
${(entity.filters || []).map(f => `    ${f}: String`).join('\n')}
  ): ${typeName}Connection`);
      }
      
      return queries.join('\n');
    }).join('\n\n');

    return `type Query {
${queries}
}`;
  }

  /**
   * Generate Mutation type
   */
  private generateMutationType(): string {
    const mutations = this.entities.map(entity => {
      const name = entity.name;
      const typeName = this.toPascalCase(name);
      
      let mutations = [];
      
      if (entity.operations.includes('create')) {
        mutations.push(`  create${typeName}(input: Create${typeName}Input!): ${typeName}`);
      }
      
      if (entity.operations.includes('update')) {
        mutations.push(`  update${typeName}(id: ID!, input: Update${typeName}Input!): ${typeName}`);
      }
      
      if (entity.operations.includes('delete')) {
        mutations.push(`  delete${typeName}(id: ID!): Boolean`);
      }
      
      return mutations.join('\n');
    }).join('\n\n');

    return `type Mutation {
${mutations}
}`;
  }

  /**
   * Generate common types
   */
  private generateCommonTypes(): string {
    const connectionTypes = this.entities.map(entity => {
      const typeName = this.toPascalCase(entity.name);
      return `type ${typeName}Connection {
  data: [${typeName}!]!
  pagination: Pagination!
}`;
    }).join('\n\n');

    return `
enum SortOrder {
  ASC
  DESC
}

type Pagination {
  page: Int!
  limit: Int!
  total: Int!
  totalPages: Int!
}

${connectionTypes}
`;
  }

  /**
   * Map field type to GraphQL type
   */
  private mapFieldType(field: FieldConfig, required = true): string {
    const typeMap: Record<string, string> = {
      uuid: 'ID',
      string: 'String',
      text: 'String',
      integer: 'Int',
      number: 'Float',
      decimal: 'Float',
      boolean: 'Boolean',
      timestamp: 'String',
      timestamptz: 'String',
      array: '[String]',
      jsonb: 'JSON',
      object: 'JSON'
    };

    const gqlType = typeMap[field.type] || 'String';
    return required && field.required ? `${gqlType}!` : gqlType;
  }

  /**
   * Map field to input type
   */
  private mapInputType(field: FieldConfig): string {
    const baseType = this.mapFieldType(field, false);
    return field.required ? `${baseType}!` : baseType;
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Save schema to database
   */
  async saveSchema(version: string): Promise<void> {
    const sdl = this.generateSchema();

    await supabase.from('module_graphql_schemas').insert({
      module_id: this.moduleId,
      version,
      sdl,
      generated_from: this.entities
    });
  }
}
```

---

### Task 4: SDK Generator (2 hours)

```typescript
// src/lib/modules/api-mode/sdk-generator.ts

import { EntityConfig, FieldConfig } from './rest-api-generator';

export type SDKLanguage = 'typescript' | 'javascript' | 'python';

export class SDKGenerator {
  private moduleName: string;
  private baseUrl: string;
  private entities: EntityConfig[];

  constructor(moduleName: string, baseUrl: string, entities: EntityConfig[]) {
    this.moduleName = moduleName;
    this.baseUrl = baseUrl;
    this.entities = entities;
  }

  /**
   * Generate SDK for specified language
   */
  generate(language: SDKLanguage): string {
    switch (language) {
      case 'typescript':
        return this.generateTypeScript();
      case 'javascript':
        return this.generateJavaScript();
      case 'python':
        return this.generatePython();
    }
  }

  /**
   * Generate TypeScript SDK
   */
  private generateTypeScript(): string {
    const interfaces = this.entities.map(e => this.generateTSInterface(e)).join('\n\n');
    const clientMethods = this.entities.map(e => this.generateTSClientMethods(e)).join('\n\n');

    return `// ${this.moduleName} SDK
// Auto-generated - Do not edit manually

export interface SDKConfig {
  apiKey: string;
  baseUrl?: string;
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

export interface ListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}

${interfaces}

export class ${this.toPascalCase(this.moduleName)}Client {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: SDKConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || '${this.baseUrl}';
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    params?: Record<string, any>
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || \`HTTP \${response.status}\`);
    }

    return response.json();
  }

${clientMethods}
}

// Default export
export default ${this.toPascalCase(this.moduleName)}Client;
`;
  }

  /**
   * Generate TypeScript interface for entity
   */
  private generateTSInterface(entity: EntityConfig): string {
    const fields = entity.fields
      .filter(f => !f.hidden)
      .map(f => `  ${f.name}${f.required ? '' : '?'}: ${this.mapTSType(f.type)};`)
      .join('\n');

    const createFields = entity.fields
      .filter(f => !f.readonly && !f.hidden)
      .map(f => `  ${f.name}${f.required ? '' : '?'}: ${this.mapTSType(f.type)};`)
      .join('\n');

    return `export interface ${this.toPascalCase(entity.name)} {
${fields}
}

export interface Create${this.toPascalCase(entity.name)} {
${createFields}
}

export interface Update${this.toPascalCase(entity.name)} {
${createFields.replace(/: /g, '?: ')}
}`;
  }

  /**
   * Generate TypeScript client methods for entity
   */
  private generateTSClientMethods(entity: EntityConfig): string {
    const name = entity.name;
    const typeName = this.toPascalCase(name);
    const methods: string[] = [];

    if (entity.operations.includes('list')) {
      methods.push(`
  async list${typeName}s(params?: ListParams): Promise<PaginatedResponse<${typeName}>> {
    return this.request('GET', '/${name}', undefined, params);
  }`);
    }

    if (entity.operations.includes('read')) {
      methods.push(`
  async get${typeName}(id: string): Promise<{ data: ${typeName} }> {
    return this.request('GET', \`/${name}/\${id}\`);
  }`);
    }

    if (entity.operations.includes('create')) {
      methods.push(`
  async create${typeName}(data: Create${typeName}): Promise<{ data: ${typeName} }> {
    return this.request('POST', '/${name}', data);
  }`);
    }

    if (entity.operations.includes('update')) {
      methods.push(`
  async update${typeName}(id: string, data: Update${typeName}): Promise<{ data: ${typeName} }> {
    return this.request('PATCH', \`/${name}/\${id}\`, data);
  }`);
    }

    if (entity.operations.includes('delete')) {
      methods.push(`
  async delete${typeName}(id: string): Promise<{ success: boolean }> {
    return this.request('DELETE', \`/${name}/\${id}\`);
  }`);
    }

    return `  // ${typeName} methods
${methods.join('\n')}`;
  }

  /**
   * Generate JavaScript SDK (no types)
   */
  private generateJavaScript(): string {
    const clientMethods = this.entities.map(e => this.generateJSClientMethods(e)).join('\n\n');

    return `// ${this.moduleName} SDK
// Auto-generated - Do not edit manually

class ${this.toPascalCase(this.moduleName)}Client {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || '${this.baseUrl}';
  }

  async request(method, path, body, params) {
    const url = new URL(path, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || \`HTTP \${response.status}\`);
    }

    return response.json();
  }

${clientMethods}
}

module.exports = ${this.toPascalCase(this.moduleName)}Client;
`;
  }

  private generateJSClientMethods(entity: EntityConfig): string {
    const name = entity.name;
    const typeName = this.toPascalCase(name);
    const methods: string[] = [];

    if (entity.operations.includes('list')) {
      methods.push(`  async list${typeName}s(params) {
    return this.request('GET', '/${name}', undefined, params);
  }`);
    }

    if (entity.operations.includes('read')) {
      methods.push(`  async get${typeName}(id) {
    return this.request('GET', \`/${name}/\${id}\`);
  }`);
    }

    if (entity.operations.includes('create')) {
      methods.push(`  async create${typeName}(data) {
    return this.request('POST', '/${name}', data);
  }`);
    }

    if (entity.operations.includes('update')) {
      methods.push(`  async update${typeName}(id, data) {
    return this.request('PATCH', \`/${name}/\${id}\`, data);
  }`);
    }

    if (entity.operations.includes('delete')) {
      methods.push(`  async delete${typeName}(id) {
    return this.request('DELETE', \`/${name}/\${id}\`);
  }`);
    }

    return methods.join('\n\n');
  }

  /**
   * Generate Python SDK
   */
  private generatePython(): string {
    const classes = this.entities.map(e => this.generatePythonClass(e)).join('\n\n');
    const methods = this.entities.map(e => this.generatePythonMethods(e)).join('\n\n');

    return `# ${this.moduleName} SDK
# Auto-generated - Do not edit manually

import requests
from dataclasses import dataclass
from typing import Optional, List, Dict, Any

@dataclass
class Pagination:
    page: int
    limit: int
    total: int
    total_pages: int

${classes}

class ${this.toPascalCase(this.moduleName)}Client:
    def __init__(self, api_key: str, base_url: str = "${this.baseUrl}"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })

    def _request(self, method: str, path: str, json: dict = None, params: dict = None) -> dict:
        url = f"{self.base_url}{path}"
        response = self.session.request(method, url, json=json, params=params)
        response.raise_for_status()
        return response.json()

${methods}
`;
  }

  private generatePythonClass(entity: EntityConfig): string {
    const name = this.toPascalCase(entity.name);
    const fields = entity.fields
      .filter(f => !f.hidden)
      .map(f => `    ${f.name}: ${this.mapPythonType(f.type, !f.required)}`)
      .join('\n');

    return `@dataclass
class ${name}:
${fields}`;
  }

  private generatePythonMethods(entity: EntityConfig): string {
    const name = entity.name;
    const typeName = this.toPascalCase(name);
    const methods: string[] = [];

    if (entity.operations.includes('list')) {
      methods.push(`    def list_${name}s(self, page: int = 1, limit: int = 20, **filters) -> Dict[str, Any]:
        params = {"page": page, "limit": limit, **filters}
        return self._request("GET", "/${name}", params=params)`);
    }

    if (entity.operations.includes('read')) {
      methods.push(`    def get_${name}(self, id: str) -> Dict[str, Any]:
        return self._request("GET", f"/${name}/{id}")`);
    }

    if (entity.operations.includes('create')) {
      methods.push(`    def create_${name}(self, data: dict) -> Dict[str, Any]:
        return self._request("POST", "/${name}", json=data)`);
    }

    if (entity.operations.includes('update')) {
      methods.push(`    def update_${name}(self, id: str, data: dict) -> Dict[str, Any]:
        return self._request("PATCH", f"/${name}/{id}", json=data)`);
    }

    if (entity.operations.includes('delete')) {
      methods.push(`    def delete_${name}(self, id: str) -> Dict[str, Any]:
        return self._request("DELETE", f"/${name}/{id}")`);
    }

    return methods.join('\n\n');
  }

  // Type mapping helpers
  private mapTSType(type: string): string {
    const map: Record<string, string> = {
      uuid: 'string',
      string: 'string',
      text: 'string',
      integer: 'number',
      number: 'number',
      decimal: 'number',
      boolean: 'boolean',
      timestamp: 'string',
      timestamptz: 'string',
      array: 'string[]',
      jsonb: 'Record<string, any>',
      object: 'Record<string, any>'
    };
    return map[type] || 'any';
  }

  private mapPythonType(type: string, optional: boolean): string {
    const map: Record<string, string> = {
      uuid: 'str',
      string: 'str',
      text: 'str',
      integer: 'int',
      number: 'float',
      decimal: 'float',
      boolean: 'bool',
      timestamp: 'str',
      timestamptz: 'str',
      array: 'List[str]',
      jsonb: 'Dict[str, Any]',
      object: 'Dict[str, Any]'
    };
    const pyType = map[type] || 'Any';
    return optional ? `Optional[${pyType}] = None` : pyType;
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}
```

---

### Task 5: API Documentation Generator (1 hour)

```typescript
// src/lib/modules/api-mode/docs-generator.ts

import { EntityConfig, FieldConfig } from './rest-api-generator';

export class APIDocsGenerator {
  private moduleName: string;
  private version: string;
  private baseUrl: string;
  private entities: EntityConfig[];

  constructor(
    moduleName: string,
    version: string,
    baseUrl: string,
    entities: EntityConfig[]
  ) {
    this.moduleName = moduleName;
    this.version = version;
    this.baseUrl = baseUrl;
    this.entities = entities;
  }

  /**
   * Generate OpenAPI 3.0 specification
   */
  generateOpenAPI(): object {
    return {
      openapi: '3.0.3',
      info: {
        title: `${this.moduleName} API`,
        version: this.version,
        description: `REST API for ${this.moduleName} module`
      },
      servers: [
        { url: this.baseUrl, description: 'API Server' }
      ],
      security: [
        { apiKey: [] }
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
            description: 'Bearer token authentication'
          }
        },
        schemas: this.generateSchemas()
      },
      paths: this.generatePaths()
    };
  }

  /**
   * Generate Markdown documentation
   */
  generateMarkdown(): string {
    const sections = this.entities.map(e => this.generateEntityDocs(e)).join('\n\n---\n\n');

    return `# ${this.moduleName} API Documentation

Version: ${this.version}

Base URL: \`${this.baseUrl}\`

## Authentication

All API requests require an API key. Include it in the header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Rate Limiting

- 60 requests per minute per API key
- 10,000 requests per day per API key

## Response Format

All responses are JSON:

\`\`\`json
{
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
\`\`\`

---

${sections}

## Errors

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Server Error - Something went wrong |
`;
  }

  private generateSchemas(): Record<string, object> {
    const schemas: Record<string, object> = {
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' }
        }
      }
    };

    for (const entity of this.entities) {
      const name = this.toPascalCase(entity.name);
      
      schemas[name] = {
        type: 'object',
        properties: this.fieldsToProperties(entity.fields.filter(f => !f.hidden)),
        required: entity.fields.filter(f => f.required && !f.hidden).map(f => f.name)
      };

      schemas[`Create${name}`] = {
        type: 'object',
        properties: this.fieldsToProperties(entity.fields.filter(f => !f.hidden && !f.readonly)),
        required: entity.fields.filter(f => f.required && !f.hidden && !f.readonly).map(f => f.name)
      };

      schemas[`${name}List`] = {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: `#/components/schemas/${name}` }
          },
          pagination: { $ref: '#/components/schemas/Pagination' }
        }
      };
    }

    return schemas;
  }

  private generatePaths(): Record<string, object> {
    const paths: Record<string, object> = {};

    for (const entity of this.entities) {
      const name = entity.name;
      const typeName = this.toPascalCase(name);

      // List/Create endpoints
      if (entity.operations.includes('list') || entity.operations.includes('create')) {
        paths[`/${name}`] = {};

        if (entity.operations.includes('list')) {
          (paths[`/${name}`] as any).get = {
            summary: `List ${typeName}s`,
            tags: [typeName],
            parameters: [
              { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
              { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
              { name: 'sort', in: 'query', schema: { type: 'string' } },
              { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
              { name: 'search', in: 'query', schema: { type: 'string' } },
              ...(entity.filters || []).map(f => ({
                name: f,
                in: 'query',
                schema: { type: 'string' }
              }))
            ],
            responses: {
              200: {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: { $ref: `#/components/schemas/${typeName}List` }
                  }
                }
              }
            }
          };
        }

        if (entity.operations.includes('create')) {
          (paths[`/${name}`] as any).post = {
            summary: `Create ${typeName}`,
            tags: [typeName],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/Create${typeName}` }
                }
              }
            },
            responses: {
              201: {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: { $ref: `#/components/schemas/${typeName}` }
                  }
                }
              }
            }
          };
        }
      }

      // Get/Update/Delete endpoints
      if (entity.operations.includes('read') || 
          entity.operations.includes('update') || 
          entity.operations.includes('delete')) {
        paths[`/${name}/{id}`] = {};

        if (entity.operations.includes('read')) {
          (paths[`/${name}/{id}`] as any).get = {
            summary: `Get ${typeName}`,
            tags: [typeName],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
            ],
            responses: {
              200: {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: { $ref: `#/components/schemas/${typeName}` }
                  }
                }
              }
            }
          };
        }

        if (entity.operations.includes('update')) {
          (paths[`/${name}/{id}`] as any).patch = {
            summary: `Update ${typeName}`,
            tags: [typeName],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
            ],
            requestBody: {
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/Create${typeName}` }
                }
              }
            },
            responses: {
              200: {
                description: 'Updated',
                content: {
                  'application/json': {
                    schema: { $ref: `#/components/schemas/${typeName}` }
                  }
                }
              }
            }
          };
        }

        if (entity.operations.includes('delete')) {
          (paths[`/${name}/{id}`] as any).delete = {
            summary: `Delete ${typeName}`,
            tags: [typeName],
            parameters: [
              { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
            ],
            responses: {
              200: {
                description: 'Deleted'
              }
            }
          };
        }
      }
    }

    return paths;
  }

  private generateEntityDocs(entity: EntityConfig): string {
    const name = entity.name;
    const typeName = this.toPascalCase(name);

    const fieldsTable = entity.fields
      .filter(f => !f.hidden)
      .map(f => `| ${f.name} | ${f.type} | ${f.required ? '✓' : ''} | ${f.readonly ? 'Read-only' : ''} |`)
      .join('\n');

    let docs = `## ${typeName}

### Fields

| Name | Type | Required | Notes |
|------|------|----------|-------|
${fieldsTable}

### Endpoints
`;

    if (entity.operations.includes('list')) {
      docs += `
#### List ${typeName}s

\`\`\`
GET /${name}
\`\`\`

**Query Parameters:**
- \`page\` - Page number (default: 1)
- \`limit\` - Items per page (default: 20, max: 100)
- \`sort\` - Sort field
- \`order\` - Sort order (asc/desc)
- \`search\` - Search query
${(entity.filters || []).map(f => `- \`${f}\` - Filter by ${f}`).join('\n')}
`;
    }

    if (entity.operations.includes('read')) {
      docs += `
#### Get ${typeName}

\`\`\`
GET /${name}/{id}
\`\`\`
`;
    }

    if (entity.operations.includes('create')) {
      docs += `
#### Create ${typeName}

\`\`\`
POST /${name}
\`\`\`

**Body:** JSON object with fields above
`;
    }

    if (entity.operations.includes('update')) {
      docs += `
#### Update ${typeName}

\`\`\`
PATCH /${name}/{id}
\`\`\`

**Body:** JSON object with fields to update
`;
    }

    if (entity.operations.includes('delete')) {
      docs += `
#### Delete ${typeName}

\`\`\`
DELETE /${name}/{id}
\`\`\`
`;
    }

    return docs;
  }

  private fieldsToProperties(fields: FieldConfig[]): Record<string, object> {
    const properties: Record<string, object> = {};
    
    for (const field of fields) {
      properties[field.name] = {
        type: this.mapOpenAPIType(field.type)
      };
    }
    
    return properties;
  }

  private mapOpenAPIType(type: string): string {
    const map: Record<string, string> = {
      uuid: 'string',
      string: 'string',
      text: 'string',
      integer: 'integer',
      number: 'number',
      decimal: 'number',
      boolean: 'boolean',
      timestamp: 'string',
      timestamptz: 'string',
      array: 'array',
      jsonb: 'object',
      object: 'object'
    };
    return map[type] || 'string';
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}
```

---

## ✅ Verification Checklist

- [ ] REST endpoints generate correctly
- [ ] CRUD operations work
- [ ] Pagination functions
- [ ] Filtering works
- [ ] GraphQL schema generates
- [ ] GraphQL queries execute
- [ ] SDK generates for all languages
- [ ] SDK is usable
- [ ] OpenAPI spec is valid
- [ ] Markdown docs are readable

---

## 📍 Dependencies

- **Requires**: EM-12, EM-13 (API gateway, auth)
- **Required by**: External integrations, mobile apps
