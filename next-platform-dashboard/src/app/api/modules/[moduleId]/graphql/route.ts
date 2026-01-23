/**
 * Phase EM-33: Module GraphQL API Endpoint
 * 
 * GraphQL endpoint for module data access
 * Handles queries and mutations through a unified GraphQL interface
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { APIConsumerService, GraphQLSchemaGenerator } from '@/lib/modules/api-mode';
import type { EntityConfig } from '@/lib/modules/api-mode';

// Cache for module configurations and schemas
const schemaCache = new Map<string, { schema: string; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

async function validateApiKey(request: NextRequest): Promise<{
  valid: boolean;
  consumer?: any;
  installationId?: string;
  error?: string;
  statusCode?: number;
}> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid authorization header', statusCode: 401 };
  }

  const apiKey = authHeader.substring(7);
  
  if (!apiKey.startsWith('dk_')) {
    return { valid: false, error: 'Invalid API key format', statusCode: 401 };
  }

  const consumerService = new APIConsumerService();
  const consumer = await consumerService.validateApiKey(apiKey);

  if (!consumer) {
    return { valid: false, error: 'Invalid or expired API key', statusCode: 401 };
  }

  // Check rate limit
  const rateLimitStatus = await consumerService.checkRateLimit(consumer.id);
  if (!rateLimitStatus.allowed) {
    return { valid: false, error: 'Rate limit exceeded', statusCode: 429 };
  }

  return { 
    valid: true, 
    consumer, 
    installationId: consumer.siteModuleInstallationId 
  };
}

async function getModuleEntities(moduleId: string, installationId: string): Promise<EntityConfig[]> {
  const supabase = createAdminClient();
  
  // Get installation first
  const { data: installation } = await (supabase as any)
    .from('site_module_installations')
    .select('id, module_id, site_id')
    .eq('id', installationId)
    .eq('module_id', moduleId)
    .single();

  if (!installation) {
    return [];
  }

  // Get module data separately
  const { data: moduleData } = await (supabase as any)
    .from('modules')
    .select('id, name, slug, schema_config')
    .eq('id', moduleId)
    .single();

  return moduleData?.schema_config?.entities || [];
}

// Simple GraphQL query parser
function parseGraphQLQuery(query: string): {
  operationType: 'query' | 'mutation';
  operationName?: string;
  selectionSet: string[];
} {
  const trimmed = query.trim();
  
  let operationType: 'query' | 'mutation' = 'query';
  if (trimmed.startsWith('mutation')) {
    operationType = 'mutation';
  }

  // Extract operation name
  const opMatch = trimmed.match(/^(query|mutation)\s+(\w+)?/);
  const operationName = opMatch?.[2];

  // Extract selection set (field names)
  const fieldMatches = trimmed.match(/\w+(?=\s*[\({]|\s*$)/g) || [];
  const selectionSet = fieldMatches.filter(f => 
    !['query', 'mutation', operationName].includes(f)
  );

  return { operationType, operationName, selectionSet };
}

// Execute a simple GraphQL-like query
async function executeQuery(
  entities: EntityConfig[],
  installationId: string,
  moduleId: string,
  query: string,
  variables: Record<string, any> = {}
): Promise<{ data?: any; errors?: any[] }> {
  const supabase = createAdminClient();
  const parsed = parseGraphQLQuery(query);
  
  // Extract the main query/mutation name
  // This is a simplified executor - real GraphQL would need a proper parser
  const queryMatch = query.match(/{\s*(\w+)/);
  if (!queryMatch) {
    return { errors: [{ message: 'Invalid query format' }] };
  }

  const rootField = queryMatch[1];
  
  // Check if it's a list query or single item query
  const isListQuery = rootField.startsWith('all') || rootField.endsWith('s') || rootField.endsWith('List');
  const isMutation = parsed.operationType === 'mutation';

  // Find matching entity
  let entityName = rootField;
  if (isListQuery) {
    entityName = rootField.replace(/^all/, '').replace(/List$/, '').replace(/s$/, '');
  }
  if (isMutation) {
    entityName = rootField.replace(/^(create|update|delete)/, '');
  }

  const entity = entities.find(e => 
    e.name.toLowerCase() === entityName.toLowerCase() ||
    e.tableName.toLowerCase() === entityName.toLowerCase()
  );

  if (!entity) {
    return { errors: [{ message: `Unknown field: ${rootField}` }] };
  }

  const tableName = entity.tableName;

  // Build and execute query
  if (isMutation) {
    if (rootField.startsWith('create')) {
      const input = variables.input || {};
      const { data, error } = await (supabase as any)
        .from(tableName)
        .insert({ ...input, site_module_installation_id: installationId })
        .select()
        .single();

      if (error) {
        return { errors: [{ message: error.message }] };
      }
      return { data: { [rootField]: data } };
    }
    
    if (rootField.startsWith('update')) {
      const { id, input } = variables;
      if (!id) {
        return { errors: [{ message: 'ID is required for update' }] };
      }
      
      const { data, error } = await (supabase as any)
        .from(tableName)
        .update(input)
        .eq('id', id)
        .eq('site_module_installation_id', installationId)
        .select()
        .single();

      if (error) {
        return { errors: [{ message: error.message }] };
      }
      return { data: { [rootField]: data } };
    }
    
    if (rootField.startsWith('delete')) {
      const { id } = variables;
      if (!id) {
        return { errors: [{ message: 'ID is required for delete' }] };
      }
      
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('site_module_installation_id', installationId);

      if (error) {
        return { errors: [{ message: error.message }] };
      }
      return { data: { [rootField]: { success: true } } };
    }
  } else {
    // Query
    let queryBuilder = (supabase as any)
      .from(tableName)
      .select('*')
      .eq('site_module_installation_id', installationId);

    if (isListQuery) {
      // Apply pagination
      const first = variables.first || 20;
      const offset = variables.offset || 0;
      
      queryBuilder = queryBuilder.range(offset, offset + first - 1);

      // Apply filters
      if (variables.filter) {
        for (const [key, value] of Object.entries(variables.filter)) {
          if (typeof value === 'object' && value !== null) {
            // Handle operators
            const ops = value as Record<string, any>;
            if (ops.eq !== undefined) queryBuilder = queryBuilder.eq(key, ops.eq);
            if (ops.neq !== undefined) queryBuilder = queryBuilder.neq(key, ops.neq);
            if (ops.gt !== undefined) queryBuilder = queryBuilder.gt(key, ops.gt);
            if (ops.gte !== undefined) queryBuilder = queryBuilder.gte(key, ops.gte);
            if (ops.lt !== undefined) queryBuilder = queryBuilder.lt(key, ops.lt);
            if (ops.lte !== undefined) queryBuilder = queryBuilder.lte(key, ops.lte);
            if (ops.like !== undefined) queryBuilder = queryBuilder.like(key, ops.like);
            if (ops.ilike !== undefined) queryBuilder = queryBuilder.ilike(key, ops.ilike);
            if (ops.in !== undefined) queryBuilder = queryBuilder.in(key, ops.in);
          } else {
            queryBuilder = queryBuilder.eq(key, value);
          }
        }
      }

      // Apply ordering
      if (variables.orderBy) {
        const { field, direction } = variables.orderBy;
        queryBuilder = queryBuilder.order(field, { ascending: direction === 'ASC' });
      }

      const { data, error, count } = await queryBuilder;

      if (error) {
        return { errors: [{ message: error.message }] };
      }

      return {
        data: {
          [rootField]: {
            edges: (data || []).map((node: any) => ({ node, cursor: node.id })),
            pageInfo: {
              hasNextPage: (data?.length || 0) === first,
              hasPreviousPage: offset > 0,
              totalCount: count || data?.length || 0
            }
          }
        }
      };
    } else {
      // Single item query
      const { id } = variables;
      if (id) {
        queryBuilder = queryBuilder.eq('id', id);
      }
      
      const { data, error } = await queryBuilder.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: { [rootField]: null } };
        }
        return { errors: [{ message: error.message }] };
      }

      return { data: { [rootField]: data } };
    }
  }

  return { errors: [{ message: 'Unsupported operation' }] };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const startTime = Date.now();
  const consumerService = new APIConsumerService();
  
  try {
    const { moduleId } = await params;
    
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.valid) {
      return NextResponse.json(
        { errors: [{ message: auth.error }] },
        { status: auth.statusCode }
      );
    }

    // Parse GraphQL request
    const body = await request.json();
    const { query, variables = {}, operationName } = body;

    if (!query) {
      return NextResponse.json(
        { errors: [{ message: 'Query is required' }] },
        { status: 400 }
      );
    }

    // Check scopes based on operation type
    const parsed = parseGraphQLQuery(query);
    if (parsed.operationType === 'mutation') {
      if (!auth.consumer!.scopes.includes('write') && !auth.consumer!.scopes.includes('*')) {
        return NextResponse.json(
          { errors: [{ message: 'Write scope required for mutations' }] },
          { status: 403 }
        );
      }
    } else {
      if (!auth.consumer!.scopes.includes('read') && !auth.consumer!.scopes.includes('*')) {
        return NextResponse.json(
          { errors: [{ message: 'Read scope required' }] },
          { status: 403 }
        );
      }
    }

    // Get module entities
    const entities = await getModuleEntities(moduleId, auth.installationId!);
    if (entities.length === 0) {
      return NextResponse.json(
        { errors: [{ message: 'Module has no configured entities' }] },
        { status: 400 }
      );
    }

    // Execute query
    const result = await executeQuery(
      entities,
      auth.installationId!,
      moduleId,
      query,
      variables
    );

    // Log API request
    const responseTime = Date.now() - startTime;
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    await consumerService.logRequest(
      auth.consumer!.id,
      auth.installationId!,
      { method: 'POST', path: `/graphql${operationName ? `?op=${operationName}` : ''}` },
      { statusCode: result.errors ? 400 : 200, responseTimeMs: responseTime },
      { ipAddress: clientIp, userAgent: request.headers.get('user-agent') || undefined },
      { operationName, operationType: parsed.operationType }
    ).catch((err: any) => console.error('Failed to log API request:', err));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[GraphQL API Error]', error);
    return NextResponse.json(
      { errors: [{ message: error.message || 'Internal server error' }] },
      { status: 500 }
    );
  }
}

// GET endpoint for GraphQL schema introspection
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    // Get module entities
    const entities = await getModuleEntities(moduleId, auth.installationId!);
    if (entities.length === 0) {
      return NextResponse.json(
        { error: 'Module has no configured entities' },
        { status: 400 }
      );
    }

    // Generate schema using the class directly
    const schemaGenerator = new GraphQLSchemaGenerator(moduleId, entities);
    const schemaResult = schemaGenerator.generateSchema();

    // Return schema as SDL
    return new NextResponse(schemaResult.sdl, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  } catch (error: any) {
    console.error('[GraphQL Schema Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
