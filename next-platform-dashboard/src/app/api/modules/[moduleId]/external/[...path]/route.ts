/**
 * Module External Catch-All API Route
 * 
 * Consolidated route handler for external sub-operations.
 * Replaces individual route files to reduce Vercel route count.
 * 
 * Handles:
 * - GET/PATCH/DELETE /external/domains/[domainId]
 * - POST /external/domains/[domainId]/verify
 * - GET/PATCH/DELETE /external/webhooks/[webhookId]
 * - POST /external/webhooks/[webhookId]/test
 * - GET/POST /external/oauth/clients
 * - POST /external/oauth/token
 * - OPTIONS /external/oauth/token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { DomainService } from '@/lib/modules/external/domain-service';
import { WebhookService } from '@/lib/modules/external/webhook-service';
import { OAuthService } from '@/lib/modules/external/oauth-service';
import { getModuleAndVerifyAccess } from '@/lib/modules/external/module-access';
import { addCorsHeaders } from '@/lib/modules/external/cors-middleware';

type RouteContext = {
  params: Promise<{ moduleId: string; path: string[] }>;
};

function notFound(action: string) {
  return NextResponse.json(
    { error: `Unknown external action: ${action}` },
    { status: 404 }
  );
}

// Local access check used by domains/[domainId] and webhooks/[webhookId] routes
// (they use a local helper instead of the imported one)
async function getModuleAndVerifyAccessLocal(supabase: any, moduleId: string, userId: string) {
  const { data: module, error: moduleError } = await supabase
    .from('site_modules')
    .select('site_id')
    .eq('id', moduleId)
    .single();

  if (moduleError || !module) {
    return { error: 'Module not found', status: 404 };
  }

  const { data: member } = await supabase
    .from('site_members')
    .select('role')
    .eq('site_id', module.site_id)
    .eq('user_id', userId)
    .single();

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { error: 'Forbidden', status: 403 };
  }

  return { module, siteId: module.site_id };
}

// =============================================================
// GET handler
// =============================================================
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { moduleId, path } = await params;

  // domains/[domainId] → 2 segments
  if (path[0] === 'domains' && path.length === 2) {
    return handleDomainGet(request, moduleId, path[1]);
  }

  // webhooks/[webhookId] → 2 segments
  if (path[0] === 'webhooks' && path.length === 2) {
    return handleWebhookGet(request, moduleId, path[1]);
  }

  // oauth/clients → 2 segments
  if (path[0] === 'oauth' && path[1] === 'clients' && path.length === 2) {
    return handleOAuthClientsGet(request, moduleId);
  }

  return notFound(path.join('/'));
}

// =============================================================
// PATCH handler
// =============================================================
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { moduleId, path } = await params;

  if (path[0] === 'domains' && path.length === 2) {
    return handleDomainPatch(request, moduleId, path[1]);
  }

  if (path[0] === 'webhooks' && path.length === 2) {
    return handleWebhookPatch(request, moduleId, path[1]);
  }

  return notFound(path.join('/'));
}

// =============================================================
// DELETE handler
// =============================================================
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { moduleId, path } = await params;

  if (path[0] === 'domains' && path.length === 2) {
    return handleDomainDelete(request, moduleId, path[1]);
  }

  if (path[0] === 'webhooks' && path.length === 2) {
    return handleWebhookDelete(request, moduleId, path[1]);
  }

  return notFound(path.join('/'));
}

// =============================================================
// POST handler
// =============================================================
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { moduleId, path } = await params;

  // domains/[domainId]/verify → 3 segments
  if (path[0] === 'domains' && path.length === 3 && path[2] === 'verify') {
    return handleDomainVerify(request, moduleId, path[1]);
  }

  // webhooks/[webhookId]/test → 3 segments
  if (path[0] === 'webhooks' && path.length === 3 && path[2] === 'test') {
    return handleWebhookTest(request, moduleId, path[1]);
  }

  // oauth/clients → 2 segments
  if (path[0] === 'oauth' && path[1] === 'clients' && path.length === 2) {
    return handleOAuthClientsPost(request, moduleId);
  }

  // oauth/token → 2 segments
  if (path[0] === 'oauth' && path[1] === 'token' && path.length === 2) {
    return handleOAuthToken(request, moduleId);
  }

  return notFound(path.join('/'));
}

// =============================================================
// OPTIONS handler (for oauth/token CORS)
// =============================================================
export async function OPTIONS(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  const origin = request.headers.get('origin');

  if (path[0] === 'oauth' && path[1] === 'token' && path.length === 2) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  return new NextResponse(null, { status: 204 });
}

// =============================================================
// Domain handlers
// =============================================================

async function handleDomainGet(_request: NextRequest, moduleId: string, domainId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getModuleAndVerifyAccessLocal(supabase, moduleId, user.id);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const domainService = new DomainService(access.siteId, moduleId);
    const domain = await domainService.getDomain(domainId);
    if (!domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });

    const instructions = domainService.getVerificationInstructions(domain);
    return NextResponse.json({ domain, verification: instructions });
  } catch (error: any) {
    console.error('Get domain error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get domain' }, { status: 500 });
  }
}

async function handleDomainPatch(request: NextRequest, moduleId: string, domainId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getModuleAndVerifyAccessLocal(supabase, moduleId, user.id);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await request.json();
    const { allowEmbed, allowApi, embedTypes, rateLimit } = body;

    const domainService = new DomainService(access.siteId, moduleId);
    const domain = await domainService.updateDomain(domainId, { allowEmbed, allowApi, embedTypes, rateLimit });
    return NextResponse.json({ domain });
  } catch (error: any) {
    console.error('Update domain error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update domain' }, { status: 500 });
  }
}

async function handleDomainDelete(_request: NextRequest, moduleId: string, domainId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getModuleAndVerifyAccessLocal(supabase, moduleId, user.id);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const domainService = new DomainService(access.siteId, moduleId);
    await domainService.removeDomain(domainId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete domain error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete domain' }, { status: 500 });
  }
}

async function handleDomainVerify(request: NextRequest, moduleId: string, domainId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getModuleAndVerifyAccess(moduleId, user.id);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: 403 });

    const { module } = access;
    const body = await request.json();
    const { method } = body;

    if (!method || !['dns', 'meta'].includes(method)) {
      return NextResponse.json({ error: 'Method must be "dns" or "meta"' }, { status: 400 });
    }

    const domainService = new DomainService(module.site_id, moduleId);
    const result = await domainService.verifyDomain(domainId, method);

    if (result.verified) {
      return NextResponse.json({ verified: true, message: 'Domain verified successfully' });
    } else {
      return NextResponse.json({ verified: false, error: result.error || 'Verification failed' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Domain verification error:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}

// =============================================================
// Webhook handlers
// =============================================================

async function handleWebhookGet(_request: NextRequest, moduleId: string, webhookId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getModuleAndVerifyAccessLocal(supabase, moduleId, user.id);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const webhookService = new WebhookService(access.siteId, moduleId);
    const webhook = await webhookService.getWebhook(webhookId);
    if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });

    const deliveries = await webhookService.getDeliveries(webhookId, { limit: 10 });
    return NextResponse.json({
      webhook: { ...webhook, secret: '••••••••' + webhook.secret.slice(-4) },
      deliveries
    });
  } catch (error: any) {
    console.error('Get webhook error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get webhook' }, { status: 500 });
  }
}

async function handleWebhookPatch(request: NextRequest, moduleId: string, webhookId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getModuleAndVerifyAccessLocal(supabase, moduleId, user.id);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await request.json();
    const { name, url, events, headers, isActive } = body;

    const webhookService = new WebhookService(access.siteId, moduleId);
    const webhook = await webhookService.updateWebhook(webhookId, { name, url, events, headers, isActive });
    return NextResponse.json({
      webhook: { ...webhook, secret: '••••••••' + webhook.secret.slice(-4) }
    });
  } catch (error: any) {
    console.error('Update webhook error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update webhook' }, { status: 500 });
  }
}

async function handleWebhookDelete(_request: NextRequest, moduleId: string, webhookId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getModuleAndVerifyAccessLocal(supabase, moduleId, user.id);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const webhookService = new WebhookService(access.siteId, moduleId);
    await webhookService.deleteWebhook(webhookId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete webhook error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete webhook' }, { status: 500 });
  }
}

async function handleWebhookTest(request: NextRequest, moduleId: string, webhookId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getModuleAndVerifyAccess(moduleId, user.id);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: 403 });

    const { module } = access;
    const webhookService = new WebhookService(module.site_id, moduleId);
    const result = await webhookService.testWebhook(webhookId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Test failed' }, { status: 500 });
  }
}

// =============================================================
// OAuth handlers
// =============================================================

async function handleOAuthClientsGet(_request: NextRequest, moduleId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getModuleAndVerifyAccess(moduleId, user.id);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: 403 });

    const { module } = access;
    const oauthService = new OAuthService(module.site_id, moduleId);
    const clients = await oauthService.getClients();

    const safeClients = clients.map((client: any) => ({
      ...client,
      client_secret_hash: undefined
    }));

    return NextResponse.json({ clients: safeClients });
  } catch (error: any) {
    console.error('Get OAuth clients error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get clients' }, { status: 500 });
  }
}

async function handleOAuthClientsPost(request: NextRequest, moduleId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await getModuleAndVerifyAccess(moduleId, user.id);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: 403 });

    const { module } = access;
    const body = await request.json();
    const { name, redirectUris, scopes } = body;

    if (!name || !redirectUris || !scopes) {
      return NextResponse.json({ error: 'Missing required fields: name, redirectUris, scopes' }, { status: 400 });
    }

    const oauthService = new OAuthService(module.site_id, moduleId);
    const { client, clientSecret } = await oauthService.createClient(
      { name, redirectUris, scopes },
      user.id
    );

    return NextResponse.json({
      client: { ...client, client_secret_hash: undefined },
      clientSecret
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create OAuth client error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create client' }, { status: 500 });
  }
}

async function handleOAuthToken(request: NextRequest, moduleId: string) {
  const origin = request.headers.get('origin');

  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: module, error: moduleError } = await supabase
      .from('site_modules')
      .select('site_id')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      const response = NextResponse.json({ error: 'invalid_request', error_description: 'Module not found' }, { status: 404 });
      if (origin) addCorsHeaders(response, origin);
      return response;
    }

    // Parse body (support both JSON and form-urlencoded)
    let body: Record<string, string> = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        body[key] = value.toString();
      });
    } else {
      body = await request.json().catch(() => ({}));
    }

    const { grant_type, code, client_id, client_secret, redirect_uri, refresh_token, code_verifier } = body;

    if (!grant_type) {
      const response = NextResponse.json({ error: 'invalid_request', error_description: 'grant_type is required' }, { status: 400 });
      if (origin) addCorsHeaders(response, origin);
      return response;
    }

    if (!client_id || !client_secret) {
      const response = NextResponse.json({ error: 'invalid_client', error_description: 'client_id and client_secret are required' }, { status: 401 });
      if (origin) addCorsHeaders(response, origin);
      return response;
    }

    const oauthService = new OAuthService(module.site_id, moduleId);
    let tokens;

    switch (grant_type) {
      case 'authorization_code':
        if (!code || !redirect_uri) {
          const response = NextResponse.json({ error: 'invalid_request', error_description: 'code and redirect_uri are required' }, { status: 400 });
          if (origin) addCorsHeaders(response, origin);
          return response;
        }
        tokens = await oauthService.exchangeCode(code, client_id, client_secret, redirect_uri, code_verifier);
        break;

      case 'refresh_token':
        if (!refresh_token) {
          const response = NextResponse.json({ error: 'invalid_request', error_description: 'refresh_token is required' }, { status: 400 });
          if (origin) addCorsHeaders(response, origin);
          return response;
        }
        tokens = await oauthService.refreshToken(refresh_token, client_id, client_secret);
        break;

      default: {
        const response = NextResponse.json({ error: 'unsupported_grant_type', error_description: 'Supported grant types: authorization_code, refresh_token' }, { status: 400 });
        if (origin) addCorsHeaders(response, origin);
        return response;
      }
    }

    const response = NextResponse.json(tokens);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Pragma', 'no-cache');
    if (origin) addCorsHeaders(response, origin);
    return response;
  } catch (error: any) {
    console.error('OAuth token error:', error);
    const response = NextResponse.json(
      { error: 'invalid_grant', error_description: error.message || 'Token exchange failed' },
      { status: 400 }
    );
    if (origin) addCorsHeaders(response, origin);
    return response;
  }
}
