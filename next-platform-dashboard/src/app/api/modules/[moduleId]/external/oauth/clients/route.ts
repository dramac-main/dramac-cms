/**
 * Phase EM-31: OAuth Clients Management API
 * Manage OAuth clients for external API access
 * 
 * GET /api/modules/[moduleId]/external/oauth/clients - List clients
 * POST /api/modules/[moduleId]/external/oauth/clients - Create client
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OAuthService } from '@/lib/modules/external/oauth-service';

interface RouteParams {
  params: Promise<{ moduleId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get site context from module
    const { data: module, error: moduleError } = await supabase
      .from('site_modules')
      .select('site_id')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Verify user has access to this site
    const { data: member } = await supabase
      .from('site_members')
      .select('role')
      .eq('site_id', module.site_id)
      .eq('user_id', user.id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const oauthService = new OAuthService(module.site_id, moduleId);
    const clients = await oauthService.getClients();

    // Don't return client secrets
    const safeClients = clients.map(client => ({
      ...client,
      client_secret_hash: undefined
    }));

    return NextResponse.json({ clients: safeClients });
  } catch (error: any) {
    console.error('Get OAuth clients error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { moduleId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get site context from module
    const { data: module, error: moduleError } = await supabase
      .from('site_modules')
      .select('site_id')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    // Verify user has access to this site
    const { data: member } = await supabase
      .from('site_members')
      .select('role')
      .eq('site_id', module.site_id)
      .eq('user_id', user.id)
      .single();

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, redirectUris, scopes } = body;

    if (!name || !redirectUris || !scopes) {
      return NextResponse.json(
        { error: 'Missing required fields: name, redirectUris, scopes' },
        { status: 400 }
      );
    }

    const oauthService = new OAuthService(module.site_id, moduleId);
    const { client, clientSecret } = await oauthService.createClient(
      { name, redirectUris, scopes },
      user.id
    );

    // Return client with secret (only shown once)
    return NextResponse.json({
      client: {
        ...client,
        client_secret_hash: undefined
      },
      clientSecret // Only returned on creation!
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create OAuth client error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create client' },
      { status: 500 }
    );
  }
}
