// AI Module Builder - Generate Specification API
// Phase EM-23: AI-powered module generation
// Note: AI builder tables need to be added to database types after migration

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AIModuleBuilderService } from '@/lib/modules/ai-builder/ai-service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

export async function POST(request: Request) {
  try {
    const supabase = await createClient() as AnySupabaseClient;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' }, 
        { status: 400 }
      );
    }

    // Verify user owns this session
    const { data: session } = await supabase
      .from('ai_module_sessions')
      .select('id, user_id, status')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' }, 
        { status: 404 }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this session' }, 
        { status: 403 }
      );
    }

    if (session.status === 'complete' || session.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Session is no longer active' }, 
        { status: 400 }
      );
    }

    // Check if there are any messages in the session
    const { data: messages } = await supabase
      .from('ai_module_messages')
      .select('id')
      .eq('session_id', sessionId)
      .limit(1);

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No conversation history found. Please describe your module first.' }, 
        { status: 400 }
      );
    }

    const service = new AIModuleBuilderService(sessionId);
    const spec = await service.generateSpec();

    // Get spec ID from database
    const { data: specRecord } = await supabase
      .from('ai_module_specs')
      .select('id')
      .eq('session_id', sessionId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ 
      spec, 
      specId: specRecord?.id 
    });
  } catch (error) {
    console.error('Error generating specification:', error);
    return NextResponse.json(
      { error: 'Failed to generate specification' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient() as AnySupabaseClient;
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const specId = searchParams.get('specId');

    if (!sessionId && !specId) {
      return NextResponse.json(
        { error: 'Session ID or Spec ID is required' }, 
        { status: 400 }
      );
    }

    let query = supabase
      .from('ai_module_specs')
      .select(`
        id,
        session_id,
        version,
        spec,
        is_approved,
        approved_at,
        created_at
      `);

    if (specId) {
      query = query.eq('id', specId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId).order('version', { ascending: false });
    }

    const { data: specs, error } = await query;

    if (error) {
      throw error;
    }

    // Verify user has access to these specs
    if (specs && specs.length > 0) {
      const { data: session } = await supabase
        .from('ai_module_sessions')
        .select('user_id')
        .eq('id', specs[0].session_id)
        .single();

      if (!session || session.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to access this specification' }, 
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ 
      specs,
      spec: specs?.[0] || null
    });
  } catch (error) {
    console.error('Error fetching specifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch specifications' }, 
      { status: 500 }
    );
  }
}
