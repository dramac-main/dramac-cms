/**
 * Phase EM-33: Module REST API Endpoint
 * 
 * Dynamic REST API endpoint for module data access
 * Handles all entity operations (CRUD) for API consumers
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { APIConsumerService, RESTAPIGenerator } from '@/lib/modules/api-mode';
import type { APIConfig } from '@/lib/modules/api-mode';

// Cache for module configurations
const moduleConfigCache = new Map<string, { config: APIConfig; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

async function getModuleConfig(moduleId: string, installationId: string): Promise<APIConfig | null> {
  const cacheKey = `${moduleId}:${installationId}`;
  const cached = moduleConfigCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config;
  }

  const supabase = createAdminClient();
  
  // Get module definition and installation config with separate queries
  const { data: installation } = await (supabase as any)
    .from('site_module_installations')
    .select('id, module_id, site_id')
    .eq('id', installationId)
    .eq('module_id', moduleId)
    .single();

  if (!installation) {
    return null;
  }

  const { data: moduleData } = await (supabase as any)
    .from('modules')
    .select('id, name, slug, schema_config')
    .eq('id', moduleId)
    .single();

  if (!moduleData) {
    return null;
  }

  const config: APIConfig = {
    moduleId,
    siteModuleInstallationId: installationId,
    siteId: installation.site_id,
    entities: moduleData?.schema_config?.entities || []
  };

  moduleConfigCache.set(cacheKey, { config, timestamp: Date.now() });
  return config;
}

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

  // Get full consumer data for IP check
  const fullConsumer = await consumerService.getConsumer(consumer.id);

  // Check IP whitelist if configured
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  if (fullConsumer?.allowedIps && fullConsumer.allowedIps.length > 0) {
    if (!fullConsumer.allowedIps.includes(clientIp)) {
      return { valid: false, error: 'IP address not allowed', statusCode: 403 };
    }
  }

  // Check rate limit
  const rateLimitStatus = await consumerService.checkRateLimit(consumer.id);
  if (!rateLimitStatus.allowed) {
    return { valid: false, error: 'Rate limit exceeded', statusCode: 429 };
  }

  return { 
    valid: true, 
    consumer: { ...consumer, allowedIps: fullConsumer?.allowedIps }, 
    installationId: consumer.siteModuleInstallationId 
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const startTime = Date.now();
  const consumerService = new APIConsumerService();
  
  try {
    const { moduleId, path } = await params;
    
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const entity = path?.[0];
    const recordId = path?.[1];

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity name is required' },
        { status: 400 }
      );
    }

    // Check endpoint access
    const endpointPath = `/data/${entity}`;
    if (auth.consumer!.allowed_endpoints && auth.consumer!.allowed_endpoints.length > 0) {
      const hasAccess = auth.consumer!.allowed_endpoints.some((ep: string) => 
        endpointPath.startsWith(ep) || ep === '*'
      );
      if (!hasAccess) {
        return NextResponse.json({ error: 'Endpoint not allowed' }, { status: 403 });
      }
    }

    // Check read scope
    if (!auth.consumer!.scopes.includes('read') && !auth.consumer!.scopes.includes('*')) {
      return NextResponse.json({ error: 'Read scope required' }, { status: 403 });
    }

    // Get module config
    const moduleConfig = await getModuleConfig(moduleId, auth.installationId!);
    if (!moduleConfig) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Create REST API generator with proper config
    const apiGenerator = new RESTAPIGenerator(moduleConfig);

    // Set consumer context for authorization
    apiGenerator.setConsumerContext({
      consumerId: auth.consumer!.id,
      siteModuleInstallationId: auth.installationId!,
      scopes: auth.consumer!.scopes,
      allowedEndpoints: auth.consumer!.allowed_endpoints || ['*']
    });

    // Use handleRequest method
    const response = await apiGenerator.handleRequest(request, entity, recordId);

    // Log API request
    const responseTime = Date.now() - startTime;
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    await consumerService.logRequest(
      auth.consumer!.id,
      auth.installationId!,
      { method: request.method, path: request.nextUrl.pathname },
      { statusCode: response.status, responseTimeMs: responseTime },
      { ipAddress: clientIp, userAgent: request.headers.get('user-agent') || undefined }
    ).catch((err: any) => console.error('Failed to log API request:', err));

    return response;
  } catch (error: any) {
    console.error('[REST API GET Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const startTime = Date.now();
  const consumerService = new APIConsumerService();
  
  try {
    const { moduleId, path } = await params;
    
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const entity = path?.[0];

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity name is required' },
        { status: 400 }
      );
    }

    // Check write scope
    if (!auth.consumer!.scopes.includes('write') && !auth.consumer!.scopes.includes('*')) {
      return NextResponse.json({ error: 'Write scope required' }, { status: 403 });
    }

    // Get module config
    const moduleConfig = await getModuleConfig(moduleId, auth.installationId!);
    if (!moduleConfig) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Create REST API generator with proper config
    const apiGenerator = new RESTAPIGenerator(moduleConfig);

    // Set consumer context
    apiGenerator.setConsumerContext({
      consumerId: auth.consumer!.id,
      siteModuleInstallationId: auth.installationId!,
      scopes: auth.consumer!.scopes,
      allowedEndpoints: auth.consumer!.allowed_endpoints || ['*']
    });

    // Use handleRequest method
    const response = await apiGenerator.handleRequest(request, entity);

    // Log API request
    const responseTime = Date.now() - startTime;
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    await consumerService.logRequest(
      auth.consumer!.id,
      auth.installationId!,
      { method: request.method, path: request.nextUrl.pathname },
      { statusCode: response.status, responseTimeMs: responseTime },
      { ipAddress: clientIp, userAgent: request.headers.get('user-agent') || undefined }
    ).catch((err: any) => console.error('Failed to log API request:', err));

    return response;
  } catch (error: any) {
    console.error('[REST API POST Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const startTime = Date.now();
  const consumerService = new APIConsumerService();
  
  try {
    const { moduleId, path } = await params;
    
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const entity = path?.[0];
    const recordId = path?.[1];

    if (!entity || !recordId) {
      return NextResponse.json(
        { error: 'Entity name and record ID are required' },
        { status: 400 }
      );
    }

    // Check write scope
    if (!auth.consumer!.scopes.includes('write') && !auth.consumer!.scopes.includes('*')) {
      return NextResponse.json({ error: 'Write scope required' }, { status: 403 });
    }

    // Get module config
    const moduleConfig = await getModuleConfig(moduleId, auth.installationId!);
    if (!moduleConfig) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Create REST API generator with proper config
    const apiGenerator = new RESTAPIGenerator(moduleConfig);

    // Set consumer context
    apiGenerator.setConsumerContext({
      consumerId: auth.consumer!.id,
      siteModuleInstallationId: auth.installationId!,
      scopes: auth.consumer!.scopes,
      allowedEndpoints: auth.consumer!.allowed_endpoints || ['*']
    });

    // Use handleRequest method
    const response = await apiGenerator.handleRequest(request, entity, recordId);

    // Log API request
    const responseTime = Date.now() - startTime;
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    await consumerService.logRequest(
      auth.consumer!.id,
      auth.installationId!,
      { method: request.method, path: request.nextUrl.pathname },
      { statusCode: response.status, responseTimeMs: responseTime },
      { ipAddress: clientIp, userAgent: request.headers.get('user-agent') || undefined }
    ).catch((err: any) => console.error('Failed to log API request:', err));

    return response;
  } catch (error: any) {
    console.error('[REST API PUT Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  // PATCH behaves the same as PUT for partial updates
  return PUT(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string; path: string[] }> }
) {
  const startTime = Date.now();
  const consumerService = new APIConsumerService();
  
  try {
    const { moduleId, path } = await params;
    
    // Validate API key
    const auth = await validateApiKey(request);
    if (!auth.valid) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.statusCode }
      );
    }

    const entity = path?.[0];
    const recordId = path?.[1];

    if (!entity || !recordId) {
      return NextResponse.json(
        { error: 'Entity name and record ID are required' },
        { status: 400 }
      );
    }

    // Check delete scope
    if (!auth.consumer!.scopes.includes('delete') && !auth.consumer!.scopes.includes('*')) {
      return NextResponse.json({ error: 'Delete scope required' }, { status: 403 });
    }

    // Get module config
    const moduleConfig = await getModuleConfig(moduleId, auth.installationId!);
    if (!moduleConfig) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Create REST API generator with proper config
    const apiGenerator = new RESTAPIGenerator(moduleConfig);

    // Set consumer context
    apiGenerator.setConsumerContext({
      consumerId: auth.consumer!.id,
      siteModuleInstallationId: auth.installationId!,
      scopes: auth.consumer!.scopes,
      allowedEndpoints: auth.consumer!.allowed_endpoints || ['*']
    });

    // Use handleRequest method
    const response = await apiGenerator.handleRequest(request, entity, recordId);

    // Log API request
    const responseTime = Date.now() - startTime;
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    await consumerService.logRequest(
      auth.consumer!.id,
      auth.installationId!,
      { method: request.method, path: request.nextUrl.pathname },
      { statusCode: response.status, responseTimeMs: responseTime },
      { ipAddress: clientIp, userAgent: request.headers.get('user-agent') || undefined }
    ).catch((err: any) => console.error('Failed to log API request:', err));

    return response;
  } catch (error: any) {
    console.error('[REST API DELETE Error]', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
