// AI Module Builder - Generate Code API
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
    const { sessionId, specId } = body;

    if (!sessionId || !specId) {
      return NextResponse.json(
        { error: 'Session ID and Spec ID are required' }, 
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

    // Verify spec exists and belongs to session
    const { data: spec } = await supabase
      .from('ai_module_specs')
      .select('id, session_id')
      .eq('id', specId)
      .single();

    if (!spec) {
      return NextResponse.json(
        { error: 'Specification not found' }, 
        { status: 404 }
      );
    }

    if (spec.session_id !== sessionId) {
      return NextResponse.json(
        { error: 'Specification does not belong to this session' }, 
        { status: 400 }
      );
    }

    const service = new AIModuleBuilderService(sessionId);
    const files = await service.generateCode(specId);

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' }, 
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
    const specId = searchParams.get('specId');

    if (!specId) {
      return NextResponse.json(
        { error: 'Spec ID is required' }, 
        { status: 400 }
      );
    }

    // Get spec to verify access
    const { data: spec } = await supabase
      .from('ai_module_specs')
      .select('session_id')
      .eq('id', specId)
      .single();

    if (!spec) {
      return NextResponse.json(
        { error: 'Specification not found' }, 
        { status: 404 }
      );
    }

    // Verify user owns the session
    const { data: session } = await supabase
      .from('ai_module_sessions')
      .select('user_id')
      .eq('id', spec.session_id)
      .single();

    if (!session || session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this code' }, 
        { status: 403 }
      );
    }

    // Get generated files
    const { data: files, error } = await supabase
      .from('ai_module_generated_code')
      .select('id, file_path, file_type, content, is_modified, created_at')
      .eq('spec_id', specId)
      .order('file_path');

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      files: files?.map((f: { file_path: string; file_type: string; content: string; is_modified: boolean }) => ({
        path: f.file_path,
        type: f.file_type,
        content: f.content,
        isModified: f.is_modified
      })) || []
    });
  } catch (error) {
    console.error('Error fetching generated code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generated code' }, 
      { status: 500 }
    );
  }
}
